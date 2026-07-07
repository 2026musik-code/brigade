const fs = require('fs');

function patchInstallScript(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    // First, find and replace the whole block manually
    // Just replace everything from "// Endpoint untuk Generate Script Instalasi" or "// Installation Script Generator for VPS/Termux"
    // to the end of the file.
    
    // Since worker.ts ends with "export default app;" and server.ts ends with "app.listen... startServer();"
    // It's easier to use a targeted regex replacement.
    
    const searchRegex = /app\.get\(['"]\/api\/install['"],[\s\S]*?(?=\}\);\n\n|\}\);\nexport default app;|\}\);\n\n\s*\/\/ Vite middleware)/;

    const newCode = `app.get("/api/install", (req, res) => {
    // Determine if it's hono (c) or express (req, res)
    const isHono = typeof res === 'undefined';
    const c = isHono ? req : null;
    
    const query = isHono ? (key) => c.req.query(key) : (key) => req.query[key];
    const header = isHono ? (key) => c.req.header(key) : (key) => req.headers[key.toLowerCase()];
    const urlOrigin = isHono ? new URL(c.req.url).origin : \`\${req.headers['x-forwarded-proto'] || req.protocol}://\${req.headers['x-forwarded-host'] || req.get('host')}\`;
    
    const provider = query('provider') || 'cloudflare';
    
    let pythonScript = '';
    
    if (provider === 'cloudflare') {
      const accountId = query('accountId');
      const token = query('token');
      const model = query('model') || "@cf/meta/llama-3.1-8b-instruct";
      
      if (!accountId || !token) {
        if (isHono) return c.text("echo 'Error: Missing accountId or token in URL'", 400);
        return res.status(400).send("echo 'Error: Missing accountId or token in URL'");
      }
      
      pythonScript = \`import requests
from typing import Optional, Dict, Any

class CloudflareAI:
    def __init__(self, account_id: str, api_token: str):
        self.account_id = account_id
        self.api_token = api_token
        self.base_url = f"\${urlOrigin}/api/cloudflare/"
        self.headers = {
            "X-CF-Account-ID": account_id,
            "X-CF-API-Token": api_token,
            "Content-Type": "application/json"
        }

    def run_model(self, model: str, prompt: str, max_tokens: int = 256) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{model}"
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens
        }
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as err:
            print(f"[-] Error: {err}")
        return None

if __name__ == "__main__":
    ACCOUNT_ID = "\${accountId}"
    API_TOKEN = "\${token}"
    MODEL = "\${model}"
    
    ai_client = CloudflareAI(account_id=ACCOUNT_ID, api_token=API_TOKEN)
    
    print(f"[*] Mengirim permintaan melalui API Gateway (\${urlOrigin})...")
    hasil = ai_client.run_model(model=MODEL, prompt="Sapa saya dalam satu kalimat bahasa Indonesia.")
    
    if hasil and 'result' in hasil:
        print("\\\\n[+] Response AI:\\\\n")
        res_data = hasil['result']
        if isinstance(res_data, dict) and 'response' in res_data:
            print(res_data['response'])
        else:
            print(res_data)
    else:
        print("\\\\n[-] Gagal mendapatkan respons.")\`;
    } else {
      const token = query('token');
      const baseUrl = query('baseUrl') || 'https://api.openai.com/v1';
      const model = query('model') || 'gpt-4o';
      
      if (!token) {
        if (isHono) return c.text("echo 'Error: Missing token in URL'", 400);
        return res.status(400).send("echo 'Error: Missing token in URL'");
      }
      
      pythonScript = \`import requests
from typing import Optional, Dict, Any

class OpenAIClient:
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def run_model(self, model: str, prompt: str, max_tokens: int = 256) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens
        }
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as err:
            print(f"[-] Error: {err}")
        return None

if __name__ == "__main__":
    API_KEY = "\${token}"
    BASE_URL = "\${baseUrl}"
    MODEL = "\${model}"
    
    ai_client = OpenAIClient(api_key=API_KEY, base_url=BASE_URL)
    
    print(f"[*] Mengirim permintaan ke OpenAI Compatible Endpoint (\${BASE_URL})...")
    hasil = ai_client.run_model(model=MODEL, prompt="Sapa saya dalam satu kalimat bahasa Indonesia.")
    
    if hasil and 'choices' in hasil and len(hasil['choices']) > 0:
        print("\\\\n[+] Response AI:\\\\n")
        print(hasil['choices'][0]['message']['content'])
    else:
        print("\\\\n[-] Gagal mendapatkan respons. Raw output:", hasil)\`;
    }
    
    const bashScript = \`#!/bin/bash
echo -e "\\\\e[1;36m[*] Menyiapkan environment API...\\\\e[0m"

# Deteksi Termux vs VPS Linux
if [ -n "$PREFIX" ] && [ -d "$PREFIX/usr/bin" ]; then
    echo -e "\\\\e[1;34m[*] Lingkungan Termux terdeteksi.\\\\e[0m"
    pkg update -y
    pkg install -y python python-pip
    pip install requests
else
    echo -e "\\\\e[1;34m[*] Lingkungan Linux/VPS terdeteksi.\\\\e[0m"
    if command -v apt-get >/dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    elif command -v yum >/dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v pacman >/dev/null; then
        sudo pacman -Sy --noconfirm python python-pip
    else
        echo -e "\\\\e[1;33m[!] Package manager tidak terdeteksi otomatis, pastikan Python3 terinstall.\\\\e[0m"
    fi
    pip3 install requests --break-system-packages 2>/dev/null || pip3 install requests
fi

echo -e "\\\\e[1;36m[*] Membuat file test_ai.py...\\\\e[0m"
cat << 'INNER_EOF' > test_ai.py
\${pythonScript}
INNER_EOF

echo -e "\\\\e[1;32m[+] Selesai! Menjalankan uji coba skrip...\\\\e[0m"
if command -v python3 >/dev/null; then
    python3 test_ai.py
else
    python test_ai.py
fi\`;

    if (isHono) return c.text(bashScript);
    res.setHeader('Content-Type', 'text/plain');
    res.send(bashScript);`;
    
    content = content.replace(searchRegex, newCode);
    
    if (filename === 'src/worker.ts') {
        content = content.replace(/app\.get\(['"]\/api\/install['"], \(req, res\) => \{/, `app.get("/api/install", (req) => {\n    const res = undefined;`);
    }

    fs.writeFileSync(filename, content);
}

patchInstallScript('server.ts');
patchInstallScript('src/worker.ts');
