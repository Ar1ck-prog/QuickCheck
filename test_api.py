import urllib.request, urllib.error, json

models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.0-flash']
key = 'AQ.Ab8RN6Jg1FF74s7kxUaUCjbL7IlDSN-wPcKQ7JUGMLf5fc9IYQ'

for model in models:
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
    payload = {'contents': [{'parts': [{'text': 'Say hello'}]}]}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode())
        text = data['candidates'][0]['content']['parts'][0]['text']
        print(f"[OK] {model}: {text[:80]}")
        break
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        print(f"[FAIL] {model}: HTTP {e.code}")
        if 'limit: 0' in body:
            print(f"       Quota = 0 (exhausted)")
        elif 'not found' in body.lower():
            print(f"       Model not found")
        else:
            print(f"       {body[:150]}")
    except Exception as e:
        print(f"[ERR] {model}: {e}")
