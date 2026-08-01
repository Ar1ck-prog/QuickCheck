import json
import os
import re
import time
import hashlib
import base64
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer
from collections import defaultdict
from pathlib import Path

# ===== Configuration =====
API_KEY = os.environ.get("AI_API_KEY")
if not API_KEY:
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('AI_API_KEY='):
                    API_KEY = line.strip().split('=', 1)[1]
    except FileNotFoundError:
        pass

MAX_INPUT_LENGTH = 5000
AI_MODEL = "gemini-3.5-flash"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{AI_MODEL}:generateContent"

# ===== Rate Limiting =====
rate_limit_store = defaultdict(list)
RATE_LIMIT_MAX = 10          # requests
RATE_LIMIT_WINDOW = 60       # seconds

def check_rate_limit(ip):
    """Returns True if request is allowed, False if rate limited."""
    now = time.time()
    # Clean old entries
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        return False
    rate_limit_store[ip].append(now)
    return True

# ===== Response Cache =====
response_cache = {}
CACHE_TTL = 3600  # 1 hour

def get_cached(text, country):
    key = hashlib.sha256(f"{text}:{country}".encode()).hexdigest()
    entry = response_cache.get(key)
    if entry and time.time() - entry['time'] < CACHE_TTL:
        return entry['data']
    return None

def set_cache(text, country, data):
    key = hashlib.sha256(f"{text}:{country}".encode()).hexdigest()
    response_cache[key] = {'data': data, 'time': time.time()}

# ===== Law Database =====
LAWS_DB = {}

def load_laws_db():
    """Load all JSON law files from laws_db/ directory."""
    global LAWS_DB
    db_dir = Path(__file__).parent / "laws_db"
    if not db_dir.exists():
        print(f"[WARN] laws_db/ directory not found at {db_dir}")
        return
    
    file_to_country = {
        "uk_rk.json": "РК",
        "koap_rk.json": "РК",
        "uk_rf.json": "РФ",
        "koap_rf.json": "РФ"
    }
    
    for filename, country in file_to_country.items():
        filepath = db_dir / filename
        if filepath.exists():
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    articles = json.load(f)
                if country not in LAWS_DB:
                    LAWS_DB[country] = []
                LAWS_DB[country].extend(articles)
                print(f"[OK] Loaded {len(articles)} articles from {filename}")
            except Exception as e:
                print(f"[ERR] Failed to load {filename}: {e}")

def find_relevant_articles(text, country, max_articles=5):
    """Find articles relevant to the message text using keyword matching."""
    articles = LAWS_DB.get(country, [])
    if not articles:
        return []
    
    text_lower = text.lower()
    scored = []
    
    for article in articles:
        score = 0
        # Check keywords
        for kw in article.get("keywords", []):
            if kw.lower() in text_lower:
                score += 2
        # Check examples
        for ex in article.get("examples", []):
            if any(word.lower() in text_lower for word in ex.split() if len(word) > 3):
                score += 1
        if score > 0:
            scored.append((score, article))
    
    # Sort by score descending, take top N
    scored.sort(key=lambda x: x[0], reverse=True)
    return [a for _, a in scored[:max_articles]]

# ===== Text Analysis Helpers =====
def extract_urls(text):
    """Extract URLs and suspicious domains from text."""
    url_pattern = r'(?:https?://[^\s<>\"]+|(?:www\.)[^\s<>\"]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]{2,}(?:/[^\s<>\"]*)?)'
    urls = re.findall(url_pattern, text, re.IGNORECASE)
    return [u for u in urls if '.' in u and len(u) > 5]

def extract_phones(text):
    """Extract phone numbers from text."""
    patterns = [
        r'\+7[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}',
        r'8[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}',
        r'\+7\d{10}',
        r'8\d{10}',
    ]
    phones = []
    for p in patterns:
        phones.extend(re.findall(p, text))
    return list(set(phones))

def extract_cards(text):
    """Extract bank card numbers from text."""
    # Match 16-digit card numbers with optional separators
    pattern = r'\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b'
    cards = re.findall(pattern, text)
    # Validate with Luhn algorithm
    valid_cards = []
    for card in cards:
        digits = card.replace(' ', '').replace('-', '')
        if len(digits) == 16 and luhn_check(digits):
            valid_cards.append(card)
    return valid_cards

def luhn_check(card_number):
    """Validate card number using Luhn algorithm."""
    digits = [int(d) for d in card_number]
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    total = sum(odd_digits)
    for d in even_digits:
        d *= 2
        if d > 9:
            d -= 9
        total += d
    return total % 10 == 0

def sanitize_input(text):
    """Remove prompt injection attempts and limit length."""
    if not text or not isinstance(text, str):
        return ""
    
    # Limit length
    text = text[:MAX_INPUT_LENGTH]
    
    # Remove common prompt injection patterns
    injection_patterns = [
        r'(?i)ignore\s+(all\s+)?previous\s+instructions',
        r'(?i)system\s*:',
        r'(?i)assistant\s*:',
        r'(?i)user\s*:',
        r'(?i)forget\s+(everything|all)',
        r'(?i)new\s+instructions?\s*:',
        r'(?i)override\s+prompt',
        r'(?i)act\s+as\s+(?:if\s+)?you\s+are',
        r'(?i)pretend\s+(?:you\s+are|to\s+be)',
    ]
    
    for pattern in injection_patterns:
        text = re.sub(pattern, '[FILTERED]', text)
    
    return text.strip()

def build_pre_analysis(text):
    """Extract signals from the text before sending to AI."""
    urls = extract_urls(text)
    phones = extract_phones(text)
    cards = extract_cards(text)
    
    signals = []
    
    if urls:
        signals.append(f"НАЙДЕНЫ ССЫЛКИ ({len(urls)}): {', '.join(urls[:5])}")
    if phones:
        signals.append(f"НАЙДЕНЫ ТЕЛЕФОНЫ ({len(phones)}): {', '.join(phones[:3])}")
    if cards:
        masked = [c[:4] + ' **** **** ' + c[-4:] for c in cards]
        signals.append(f"НАЙДЕНЫ НОМЕРА КАРТ ({len(cards)}): {', '.join(masked)}")
    
    # Urgency markers
    urgency_words = ['срочно', 'немедленно', 'сейчас же', 'экстренно', 'осталось', 
                     'последний шанс', 'блокировка', 'заблокирован', 'заблокирована',
                     'в течение 24 часов', 'в течение часа', 'до конца дня']
    found_urgency = [w for w in urgency_words if w.lower() in text.lower()]
    if found_urgency:
        signals.append(f"ПРИЗНАКИ СРОЧНОСТИ: {', '.join(found_urgency)}")
    
    # Authority impersonation
    authority_words = ['служба безопасности', 'сотрудник банка', 'полиция', 'прокуратура',
                       'следователь', 'налоговая', 'пенсионный фонд', 'центральный банк',
                       'нацбанк', 'финпол', 'МВД', 'ФСБ', 'Следственный комитет']
    found_authority = [w for w in authority_words if w.lower() in text.lower()]
    if found_authority:
        signals.append(f"УПОМИНАНИЕ АВТОРИТЕТОВ: {', '.join(found_authority)}")
    
    return {
        'urls': urls,
        'phones': phones, 
        'cards': cards,
        'signals': signals,
        'signal_text': '\n'.join(signals) if signals else 'Подозрительных маркеров не обнаружено.'
    }

# ===== Country-specific config =====
COUNTRY_LAW = {
    "РК": {
        "name": "Республика Казахстан",
        "code": "УК РК",
        "admin_code": "КоАП РК",
        "police": "102",
        "hotline": "Позвоните на горячую линию банка или по номеру 102"
    },
    "РФ": {
        "name": "Российская Федерация",
        "code": "УК РФ",
        "admin_code": "КоАП РФ",
        "police": "102",
        "hotline": "Позвоните на горячую линию банка или по номеру 102"
    }
}

# ===== Few-Shot Examples =====
FEW_SHOT_EXAMPLES = """
ЭТАЛОННЫЕ ПРИМЕРЫ АНАЛИЗА:

Пример 1 — МОШЕННИКИ:
Сообщение: "Здравствуйте, вам звонит служба безопасности Каспи банка. На ваш счёт пытались оформить кредит. Для отмены назовите код из SMS, который мы вам отправили."
Ответ: {"verdict": "МОШЕННИКИ", "risk_score": 95, "explanation": "Запрос SMS-кода — главный признак мошенничества. Настоящий банк НИКОГДА не запрашивает SMS-коды по телефону. Имитация авторитета (служба безопасности) и создание паники (оформление кредита).", "instructions": "Немедленно положите трубку. НЕ сообщайте никаких кодов. Позвоните в банк по номеру на обратной стороне вашей карты."}

Пример 2 — МОШЕННИКИ:
Сообщение: "Уважаемый клиент! Ваш счёт заблокирован. Для разблокировки переведите 50 000 тенге на безопасный счёт: 4276 1234 5678 9012"
Ответ: {"verdict": "МОШЕННИКИ", "risk_score": 98, "explanation": "Классическая схема: ложная блокировка + требование перевода на чужую карту. Понятие 'безопасный счёт' не существует в банковской практике. Номер карты принадлежит мошеннику.", "instructions": "Ничего не переводите. Заблокируйте номер отправителя. Обратитесь в полицию."}

Пример 3 — ПОДОЗРИТЕЛЬНО:
Сообщение: "Ваш заказ с Wildberries задержан. Подтвердите адрес доставки по ссылке: wbb-track.info/confirm"
Ответ: {"verdict": "ПОДОЗРИТЕЛЬНО", "risk_score": 55, "explanation": "Ссылка ведёт на неофициальный домен (wbb-track.info вместо wildberries.ru). Возможен фишинг: сбор персональных данных через поддельную форму.", "instructions": "Не переходите по ссылке. Проверьте статус заказа через официальное приложение или сайт Wildberries."}

Пример 4 — ПОДОЗРИТЕЛЬНО:
Сообщение: "Добрый день! Вам одобрен кредит на 500 000 тенге под 0.1% годовых. Оставьте заявку: credit-kz.com/apply"
Ответ: {"verdict": "ПОДОЗРИТЕЛЬНО", "risk_score": 50, "explanation": "Непрошенное предложение кредита с нереалистично низкой ставкой (0.1%). Ссылка ведёт на неизвестный домен. Возможно мошенничество или недобросовестная реклама.", "instructions": "Не переходите по ссылке. Если нужен кредит, обратитесь в банк напрямую."}

Пример 5 — БЕЗОПАСНО:
Сообщение: "Привет! Во сколько завтра встречаемся в кафе? Я забронировал столик на 18:00."
Ответ: {"verdict": "БЕЗОПАСНО", "risk_score": 2, "explanation": "Обычное бытовое сообщение. Нет ссылок, финансовых запросов, давления или подозрительных элементов.", "instructions": "Сообщение безопасно. Никаких действий не требуется."}

Пример 6 — БЕЗОПАСНО:
Сообщение: "Ваш заказ #12345 доставлен. Спасибо за покупку в Kaspi Магазин!"
Ответ: {"verdict": "БЕЗОПАСНО", "risk_score": 5, "explanation": "Стандартное уведомление о доставке. Нет ссылок, запросов данных или давления.", "instructions": "Сообщение безопасно."}
"""

# ===== Social Engineering Patterns =====
SOCIAL_ENGINEERING_BLOCK = """
ПРИЗНАКИ СОЦИАЛЬНОЙ ИНЖЕНЕРИИ (проверяй каждый пункт):
1. Создание ложной срочности: "осталось 5 минут", "немедленно", "до конца дня"
2. Апелляция к авторитету: "служба безопасности", "следователь", "сотрудник банка"
3. Запугивание: "уголовное дело", "блокировка всех счетов", "арест имущества"
4. Создание чувства вины: "из-за вас пострадают другие", "вы виноваты"
5. Предложение ложной помощи: "мы поможем защитить ваши деньги"
6. Изоляция жертвы: "никому не говорите", "это тайная операция", "секретная проверка"
7. Подмена контекста: "ваш родственник попал в ДТП", "ваш сын задержан"
8. Эмоциональное давление: тревога, страх, жадность (выигрыш), сочувствие
"""

CLASSIFICATION_CRITERIA_BLOCK = """
КРИТЕРИИ КЛАССИФИКАЦИИ И ОЦЕНКИ РИСКА (следуй строго):

Вердикт "МОШЕННИКИ" (risk_score 70-100) — ТОЛЬКО если есть хотя бы один ЯВНЫЙ признак:
ВНИМАНИЕ: Если мошенники просят "код подтверждения", "перейти по ссылке и ввести данные", "скачать приложение" или требуют "срочно перевести деньги" — ставь risk_score 95-100. Это 100% обман.
- Прямое требование перевести деньги на чужой счёт/карту
- Прямой запрос SMS-кода, CVV, PIN-кода, пароля, личных данных по ссылке
- Угроза блокировки счёта с требованием немедленных действий
- Предложение перевести деньги на "безопасный счёт"
- Просьба установить приложение удалённого доступа (AnyDesk, TeamViewer)
В иных случаях явного мошенничества ставь risk_score 70-94.

Вердикт "ПОДОЗРИТЕЛЬНО" (risk_score 30-69) — если сообщение вызывает сомнения, но НЕТ прямого требования денег/кодов:
- Ссылки на неизвестные сайты (но без прямого запроса платёжных данных)
- Сообщения о посылках, доставках от неизвестных отправителей
- Непрошенные предложения кредитов, выигрышей, акций
- Искусственная срочность ("24 часа", "немедленно") без прямых угроз
- Просьба "уточнить данные" без конкретного запроса финансовой информации
- Звонки/сообщения от "банка" без обращения по имени

Вердикт "БЕЗОПАСНО" (risk_score 0-29) — обычные сообщения:
- Личная переписка, бытовые договорённости
- Сообщения без ссылок, финансовых запросов и давления
- Уведомления от известных сервисов без подозрительных элементов
"""

def build_prompt(text, country, pre_analysis):
    """Build the complete analysis prompt for AI."""
    law = COUNTRY_LAW.get(country, COUNTRY_LAW["РК"])
    
    # Find relevant articles from database
    relevant = find_relevant_articles(text, country)
    articles_text = ""
    if relevant:
        articles_parts = []
        for a in relevant:
            articles_parts.append(
                f"- {a['article']} ({a['title']}): {a.get('text', '')} "
                f"Санкции: {a.get('sanctions', 'см. кодекс')}."
            )
        articles_text = "\n".join(articles_parts)
    else:
        articles_text = "База статей недоступна. Используй общие знания о законодательстве."
    
    prompt = f"""Ты — банковский ИИ-антифрод эксперт для граждан страны: {law["name"]}.

{FEW_SHOT_EXAMPLES}

{CLASSIFICATION_CRITERIA_BLOCK}
{SOCIAL_ENGINEERING_BLOCK}

ЮРИСДИКЦИЯ (СТРОГО):
Ты работаешь ТОЛЬКО по законам {law["name"]}.
Уголовный кодекс: {law["code"]}. Административный кодекс: {law["admin_code"]}.
КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО ссылаться на законы другой страны.

РЕЛЕВАНТНЫЕ СТАТЬИ:
{articles_text}

ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ СЕРВЕРА:
{pre_analysis['signal_text']}

Текст сообщения для анализа:
\"\"\"{text}\"\"\"

Проанализируй текст и выдай ответ СТРОГО в формате валидного JSON (без markdown). Экранируй кавычки.
{{
  "verdict": "МОШЕННИКИ",
  "explanation": "Объяснение на 2-4 предложения. Укажи конкретные признаки. Если мошенничество или подозрительно — укажи конкретную статью {law['code']} или {law['admin_code']}.",
  "instructions": "Конкретная инструкция на 1-3 предложения. Если мошенничество — укажи куда обращаться: {law['hotline']}.",
  "risk_score": 90,
  "social_engineering_signs": ["список", "признаков", "или пустой массив если нет"],
  "detected_article": "конкретная статья кодекса или null"
}}
ВАЖНО: Поле verdict может быть только "МОШЕННИКИ", "ПОДОЗРИТЕЛЬНО" или "БЕЗОПАСНО"
"""
    return prompt

# ===== AI API Call =====
def call_ai_api(prompt, image_data=None):
    """Call AI API with text prompt and optional image."""
    url = f"{API_URL}?key={API_KEY}"
    
    parts = [{"text": prompt}]
    
    # Add image if provided (OCR mode)
    if image_data:
        parts.append({
            "inline_data": {
                "mime_type": image_data["mime_type"],
                "data": image_data["base64"]
            }
        })
    
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        },
        # messages by design. Without this, AI blocks prompts containing
        # scam text, phishing links, financial threats, etc.
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='replace')
        print(f"[HTTP ERROR {e.code}] AI API error:\n{error_body}")
        raise
    except urllib.error.URLError as e:
        print(f"[NETWORK ERROR] Cannot reach AI API: {e.reason}")
        raise
    
    # Check if response was blocked by safety filters
    candidates = res_json.get('candidates', [])
    if not candidates:
        block_reason = res_json.get('promptFeedback', {}).get('blockReason', 'UNKNOWN')
        print(f"[BLOCKED] AI refused the prompt. Reason: {block_reason}")
        print(f"[BLOCKED] Full response: {json.dumps(res_json, ensure_ascii=False)[:500]}")
        # Return a fallback analysis instead of crashing
        return {
            "verdict": "ПОДОЗРИТЕЛЬНО",
            "explanation": "Не удалось провести полный анализ. Сообщение содержит признаки, требующие осторожности.",
            "instructions": "Будьте бдительны. Не переходите по ссылкам и не сообщайте личные данные. При сомнениях обратитесь в банк напрямую.",
            "risk_score": 50,
            "social_engineering_signs": [],
            "detected_article": None
        }
    
    candidate = candidates[0]
    finish_reason = candidate.get('finishReason', '')
    
    # Check if the candidate was stopped due to safety
    if finish_reason == 'SAFETY' or 'content' not in candidate:
        print(f"[SAFETY STOP] AI stopped generation. finishReason={finish_reason}")
        safety_ratings = candidate.get('safetyRatings', [])
        print(f"[SAFETY STOP] Ratings: {safety_ratings}")
        return {
            "verdict": "ПОДОЗРИТЕЛЬНО",
            "explanation": "Анализ был ограничен системой безопасности. Сообщение содержит потенциально опасные элементы.",
            "instructions": "Рекомендуем относиться к этому сообщению с осторожностью. Не переходите по ссылкам и не сообщайте личные данные.",
            "risk_score": 60,
            "social_engineering_signs": [],
            "detected_article": None
        }
    
    ai_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '').strip()
    
    # Robustly extract JSON using regex in case of extra text or malformed markdown blocks
    import re
    json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
    if json_match:
        ai_text = json_match.group(0)
    
    try:
        parsed = json.loads(ai_text)
        return normalize_ai_response(parsed)
    except json.JSONDecodeError:
        # AI sometimes returns broken JSON — try to repair it
        print(f"[PARSE] First parse failed, attempting JSON repair...")
        repaired = repair_json(ai_text)
        try:
            parsed = json.loads(repaired)
            print(f"[PARSE] JSON repair succeeded!")
            return normalize_ai_response(parsed)
        except json.JSONDecodeError as e2:
            print(f"[PARSE ERROR] JSON repair also failed: {e2}")
            print(f"[PARSE ERROR] Raw AI text:\n---BEGIN---\n{ai_text}\n---END---")
            # Return a fallback instead of crashing
            return normalize_ai_response({
                "verdict": "ПОДОЗРИТЕЛЬНО",
                "explanation": "ИИ вернул ответ в некорректном формате. Рекомендуем повторить анализ.",
                "instructions": "Попробуйте отсканировать сообщение ещё раз.",
                "risk_score": 50
            })

def repair_json(text):
    """Attempt to fix common JSON errors from AI output."""
    import re
    # Remove markdown code fences
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    # Remove BOM and zero-width characters
    text = text.replace('\ufeff', '').replace('\u200b', '')
    # Fix trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', text)
    # Fix missing commas between "value" "key" patterns (e.g. "text"\n  "next_key")
    text = re.sub(r'(\")\s*\n\s*(\")', r'\1,\n\2', text)
    # Fix missing comma after number/boolean/null followed by "key"
    text = re.sub(r'(\d)\s*\n\s*(\")', r'\1,\n\2', text)
    text = re.sub(r'(null|true|false)\s*\n\s*(\")', r'\1,\n\2', text)
    # Fix missing comma after ] followed by "key"  
    text = re.sub(r'(\])\s*\n\s*(\")', r'\1,\n\2', text)
    return text

def normalize_ai_response(data):
    """Ensure all required fields exist with correct types.
    This prevents frontend crashes when the AI omits or misformats fields."""
    
    # Normalize verdict
    verdict = str(data.get("verdict", "ПОДОЗРИТЕЛЬНО")).upper().strip()
    valid_verdicts = {"МОШЕННИКИ", "ПОДОЗРИТЕЛЬНО", "БЕЗОПАСНО"}
    if verdict not in valid_verdicts:
        # Try to match partial strings
        if "МОШЕН" in verdict or "SCAM" in verdict.upper():
            verdict = "МОШЕННИКИ"
        elif "БЕЗОПАС" in verdict or "SAFE" in verdict.upper():
            verdict = "БЕЗОПАСНО"
        else:
            verdict = "ПОДОЗРИТЕЛЬНО"
    data["verdict"] = verdict
    
    # Normalize risk_score — must be an integer 0-100
    try:
        risk_score = int(data.get("risk_score", 50))
        risk_score = max(0, min(100, risk_score))
    except (ValueError, TypeError):
        risk_score = 50
    data["risk_score"] = risk_score
    
    # Ensure text fields exist
    data.setdefault("explanation", "Анализ завершён.")
    data.setdefault("instructions", "Действуйте по своему усмотрению.")
    data.setdefault("detected_article", None)
    
    # Ensure social_engineering_signs is a list of strings
    signs = data.get("social_engineering_signs", [])
    if not isinstance(signs, list):
        signs = [str(signs)] if signs else []
    data["social_engineering_signs"] = [str(s) for s in signs if s]
    
    return data

# ===== Request Handler =====
class RequestHandler(SimpleHTTPRequestHandler):
    
    def do_GET(self):
        # Перенаправляем с корня на лендинг, как просил пользователь
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/landing/')
            self.end_headers()
            return
        super().do_GET()
        
    def end_headers(self):
        # Отключаем кэширование браузера для локальной разработки, чтобы изменения CSS были видны сразу
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_POST(self):
        if self.path == '/api/scan':
            self.handle_scan()
        elif self.path == '/api/scan-image':
            self.handle_scan_image()
        else:
            self.send_error_response(404, "Not Found")
    
    def handle_scan(self):
        """Handle text-based scan requests."""
        # Rate limiting
        client_ip = self.client_address[0]
        if not check_rate_limit(client_ip):
            self.send_error_response(429, "Слишком много запросов. Подождите минуту.")
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            message_text = data.get('text', '')
            country = data.get('country', 'РК')
        except json.JSONDecodeError:
            self.send_error_response(400, "Invalid JSON")
            return
        
        if not API_KEY:
            self.send_error_response(500, "API key not configured")
            return
        
        if not message_text.strip():
            self.send_error_response(400, "Текст сообщения пуст")
            return
        
        # Sanitize input
        message_text = sanitize_input(message_text)
        country = country if country in COUNTRY_LAW else 'РК'
        
        # Check cache
        cached = get_cached(message_text, country)
        if cached:
            self.send_json_response(cached)
            return
        
        # Pre-analysis
        pre_analysis = build_pre_analysis(message_text)
        
        # Build prompt
        prompt = build_prompt(message_text, country, pre_analysis)
        
        try:
            print(f"[SCAN] Calling AI API for text ({len(message_text)} chars), country={country}")
            result = call_ai_api(prompt)
            print(f"[SCAN] AI returned verdict={result.get('verdict')}, risk={result.get('risk_score')}")
            law = COUNTRY_LAW[country]
            
            # Enrich result
            result["country"] = country
            result["law_code"] = law["code"]
            result["extracted"] = {
                "urls": pre_analysis['urls'],
                "phones": pre_analysis['phones'],
                "cards": [c[:4] + ' **** **** ' + c[-4:] for c in pre_analysis['cards']]
            }
            
            # Cache result
            set_cache(message_text, country, result)
            
            response_json = json.dumps(result, ensure_ascii=False)
            print(f"[SCAN] Sending {len(response_json)} bytes to frontend")
            self.send_json_response(result)
            print(f"[SCAN] Response sent successfully")
            
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            import traceback
            print(f"[SCAN ERROR] Parse error: {e}")
            traceback.print_exc()
            self.send_error_response(500, f"Ошибка парсинга ответа ИИ: {e}")
        except urllib.error.HTTPError as e:
            print(f"[SCAN ERROR] HTTP error: {e.code}")
            if e.code == 429:
                self.send_error_response(429, "Превышен лимит запросов к ИИ. Подождите 30 секунд и попробуйте снова.")
            else:
                self.send_error_response(502, f"Ошибка API (код {e.code}). Попробуйте позже.")
        except urllib.error.URLError as e:
            print(f"[SCAN ERROR] Network error: {e.reason}")
            self.send_error_response(502, f"Не удалось подключиться к ИИ: {e.reason}")
        except Exception as e:
            import traceback
            print(f"[SCAN ERROR] Unexpected error: {type(e).__name__}: {e}")
            traceback.print_exc()
            self.send_error_response(500, f"Внутренняя ошибка: {e}")
    
    def handle_scan_image(self):
        """Handle image-based scan requests (OCR via AI Vision)."""
        client_ip = self.client_address[0]
        if not check_rate_limit(client_ip):
            self.send_error_response(429, "Слишком много запросов. Подождите минуту.")
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 10 * 1024 * 1024:  # 10MB limit
            self.send_error_response(413, "Файл слишком большой. Максимум 10 МБ.")
            return
        
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            image_base64 = data.get('image', '')
            mime_type = data.get('mime_type', 'image/jpeg')
            country = data.get('country', 'РК')
        except json.JSONDecodeError:
            self.send_error_response(400, "Invalid JSON")
            return
        
        if not API_KEY:
            self.send_error_response(500, "API key not configured")
            return
        
        if not image_base64:
            self.send_error_response(400, "Изображение не предоставлено")
            return
        
        country = country if country in COUNTRY_LAW else 'РК'
        law = COUNTRY_LAW[country]
        
        # Build OCR + analysis prompt
        ocr_prompt = f"""Ты — банковский ИИ-антифрод эксперт для граждан страны: {law["name"]}.

На изображении — скриншот сообщения из мессенджера (WhatsApp, Telegram, SMS и т.д.).

ЗАДАЧА:
1. Сначала ИЗВЛЕКИ весь текст с изображения (OCR).
2. Затем ПРОАНАЛИЗИРУЙ извлечённый текст на мошенничество.

{SOCIAL_ENGINEERING_BLOCK}
{CLASSIFICATION_CRITERIA_BLOCK}

ЮРИСДИКЦИЯ: работай ТОЛЬКО по законам {law["name"]}. Кодексы: {law["code"]}, {law["admin_code"]}.

Выдай ответ СТРОГО в формате валидного JSON (без markdown). Экранируй кавычки.
{{
  "extracted_text": "полный текст, извлечённый с изображения",
  "verdict": "МОШЕННИКИ",
  "explanation": "Объяснение на 2-4 предложения с указанием статьи закона если применимо.",
  "instructions": "Конкретная инструкция. Если мошенничество — {law['hotline']}.",
  "risk_score": 90,
  "social_engineering_signs": [],
  "detected_article": null
}}
ВАЖНО: Поле verdict может быть только "МОШЕННИКИ", "ПОДОЗРИТЕЛЬНО" или "БЕЗОПАСНО"
"""
        
        try:
            image_data = {
                "base64": image_base64,
                "mime_type": mime_type
            }
            result = call_ai_api(ocr_prompt, image_data)
            
            result["country"] = country
            result["law_code"] = law["code"]
            result["is_ocr"] = True
            
            self.send_json_response(result)
            
        except Exception as e:
            self.send_error_response(500, f"Ошибка обработки изображения: {e}")
    
    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

# ===== Main =====
if __name__ == '__main__':
    # Load law database
    load_laws_db()
    
    port = int(os.environ.get("PORT", 3000))
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"QuickCheck Server v2.0 running at http://localhost:{port}/")
    print(f"Laws loaded: {sum(len(v) for v in LAWS_DB.values())} articles")
    print(f"Rate limit: {RATE_LIMIT_MAX} req/{RATE_LIMIT_WINDOW}s per IP")
    httpd.serve_forever()
