# QuickCheck

ИИ-помощник против мошенников. Вставляешь подозрительное сообщение или скриншот, и QuickCheck объясняет, похоже ли это на мошенничество и какие статьи УК и КоАП Казахстана и России тут могут подойти. Сделан в рамках NEXTus.

- `landing/` — посадочная страница
- `index.html`, `script.js`, `style.css` — само приложение
- `server.py` — локальный сервер на Python (только стандартная библиотека), отдаёт статику и `/api/scan`, `/api/scan-image`
- `api/index.py` — тот же бэкенд в виде функции для Vercel
- `laws_db/` — база статей УК и КоАП РК и РФ

## Запуск

Нужен Python 3.10+ и ключ Gemini API (бесплатно в Google AI Studio).

```bash
# Windows PowerShell
$env:AI_API_KEY = "ваш_ключ"
python server.py
```

```bash
# macOS / Linux
export AI_API_KEY="ваш_ключ"
python server.py
```

Откройте http://localhost:3000. Вместо переменной окружения можно положить ключ в файл `.env` строкой `AI_API_KEY=...` (файл в `.gitignore`).

## Деплой на Vercel

`vercel.json` уже настроен: `/` ведёт на лендинг, `/api/*` на `api/index.py`. В настройках проекта нужно добавить переменную `AI_API_KEY`.
