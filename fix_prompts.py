import re

with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix text scan prompt
old_prompt1_regex = r'Проанализируй текст и выдай ответ СТРОГО в формате валидного JSON \(без markdown\). Экранируй кавычки\.\n\{\n  \"verdict\": \"СКАМ\",.*?\}\nВАЖНО: Поле verdict может быть только \"СКАМ\", \"ПОДОЗРИТЕЛЬНО\" или \"БЕЗОПАСНО\"\n\"\"\"'
new_prompt1 = '''Проанализируй текст и выдай ответ СТРОГО в формате валидного JSON (без markdown). Экранируй кавычки.
{{
  "verdict": "СКАМ",
  "explanation": "Объяснение на 2-4 предложения. Укажи конкретные признаки. Если мошенничество или подозрительно — укажи конкретную статью {law['code']} или {law['admin_code']}.",
  "instructions": "Конкретная инструкция на 1-3 предложения. Если мошенничество — укажи куда обращаться: {law['hotline']}.",
  "risk_score": 90,
  "social_engineering_signs": ["список", "признаков", "или пустой массив если нет"],
  "detected_article": "конкретная статья кодекса или null"
}}
ВАЖНО: Поле verdict может быть только "СКАМ", "ПОДОЗРИТЕЛЬНО" или "БЕЗОПАСНО"
"""'''

content = re.sub(old_prompt1_regex, new_prompt1, content, flags=re.DOTALL)

# Fix image scan prompt
old_prompt2_regex = r'Выдай ответ СТРОГО в формате валидного JSON \(без markdown\). Экранируй кавычки\.\n\{\n  \"extracted_text\": \"полный текст, извлечённый с изображения\",.*?\}\nВАЖНО: Поле verdict может быть только \"СКАМ\", \"ПОДОЗРИТЕЛЬНО\" или \"БЕЗОПАСНО\"\n\"\"\"'
new_prompt2 = '''Выдай ответ СТРОГО в формате валидного JSON (без markdown). Экранируй кавычки.
{{
  "extracted_text": "полный текст, извлечённый с изображения",
  "verdict": "СКАМ",
  "explanation": "Объяснение на 2-4 предложения с указанием статьи закона если применимо.",
  "instructions": "Конкретная инструкция. Если мошенничество — {law['hotline']}.",
  "risk_score": 90,
  "social_engineering_signs": [],
  "detected_article": null
}}
ВАЖНО: Поле verdict может быть только "СКАМ", "ПОДОЗРИТЕЛЬНО" или "БЕЗОПАСНО"
"""'''

content = re.sub(old_prompt2_regex, new_prompt2, content, flags=re.DOTALL)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated server.py again')
