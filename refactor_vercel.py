import os

with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix imports
content = content.replace('from http.server import SimpleHTTPRequestHandler, HTTPServer', 'from http.server import BaseHTTPRequestHandler')
content = content.replace('class RequestHandler(SimpleHTTPRequestHandler):', 'class handler(BaseHTTPRequestHandler):')

# Fix laws_db path
code_to_add = '''
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
'''
content = content.replace('import json', 'import json' + code_to_add)
content = content.replace("'laws_db/", "os.path.join(BASE_DIR, 'laws_db') + '/'")

# Remove server starting logic
idx = content.find('def run(')
if idx != -1:
    content = content[:idx]

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(content)

# create vercel.json
vercel_json = '''{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.py" }
  ],
  "redirects": [
    { "source": "/", "destination": "/landing/index.html", "permanent": false }
  ]
}'''
with open('vercel.json', 'w', encoding='utf-8') as f:
    f.write(vercel_json)
