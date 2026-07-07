const fs = require('fs');

function patchInstallScript(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    const searchRegex = /app\.get\(['"]\/api\/install['"],[\s\S]*?(?=\}\);\n\n|\}\);\nexport default app;|\}\);\n\n\s*\/\/ Vite middleware)/;

    const newCode = `app.get("/api/install", (req, res) => {
    // Determine if it's hono (c) or express (req, res)
    const isHono = typeof res === 'undefined';
    const c = isHono ? req : null;
    
    const query = isHono ? (key) => c.req.query(key) : (key) => req.query[key];
    const header = isHono ? (key) => c.req.header(key) : (key) => req.headers[key.toLowerCase()];
    const urlOrigin = isHono ? new URL(c.req.url).origin : \\\`\\\${req.headers['x-forwarded-proto'] || req.protocol}://\\\${req.headers['x-forwarded-host'] || req.get('host')}\\\`;
    
    const provider = query('provider') || 'cloudflare';
    
    const accountId = query('accountId') || '';
    const token = query('token') || '';
    const baseUrl = query('baseUrl') || 'https://api.openai.com/v1';
    let model = query('model');
    
    if (provider === 'cloudflare' && !model) model = "@cf/meta/llama-3.1-8b-instruct";
    if (provider === 'openai' && !model) model = "gpt-4o";
      
    if (!token) {
        if (isHono) return c.text("echo 'Error: Missing token in URL'", 400);
        return res.status(400).send("echo 'Error: Missing token in URL'");
    }
      
    const pythonScript = \\\`import requests
import json
import os
import sys
import platform
import subprocess
from typing import Optional, Dict, Any

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

LOGO = r"""
\\\\033[1;36m
   ___ _                 _  __ _                  _    ___ 
  / __\\\\ | ___  _   _  __| |/ _| | __ _ _ __ ___  / \\\\  |_ _|
 / /  | |/ _ \\\\| | | |/ _\\\\_ | |_| |/ _\\\\_ | '__/ _ \\\\/ _ \\\\  | | 
/ /___| | (_) | |_| | (_| |  _| | (_| | | |  __/ ___ \\\\ | | 
\\\\____/|_|\\\\___/ \\\\__,_|\\\\__,_|_| |_|\\\\__,_|_|  \\\\__/_/   \\\\_\\\\___|
\\\\033[0m
\\\\033[1;33m       Professional AI CLI Interface       \\\\033[0m
"""

class AIClient:
    def __init__(self, provider, api_key, account_id, app_origin, openai_base_url, default_model):
        self.provider = provider
        self.api_key = api_key
        self.account_id = account_id
        self.app_origin = app_origin.rstrip('/')
        self.openai_base_url = openai_base_url.rstrip('/')
        self.model = default_model
        self.history = []

    def get_sys_info(self):
        try:
            info = f"OS: {platform.system()} {platform.release()}"
            if platform.system() == "Linux":
                try:
                    out = subprocess.check_output("free -h", shell=True, stderr=subprocess.DEVNULL).decode().strip()
                    info += f"\\\\n[RAM Info]:\\\\n{out}"
                except:
                    pass
                try:
                    df = subprocess.check_output("df -h /", shell=True, stderr=subprocess.DEVNULL).decode().strip()
                    info += f"\\\\n[Disk Info]:\\\\n{df}"
                except:
                    pass
            return info
        except:
            return "System info not available"

    def send_message(self, prompt: str):
        actual_prompt = prompt
        if not self.history:
            sys_info = self.get_sys_info()
            actual_prompt = f"[System Context: You are a CLI AI Assistant. User System: {sys_info}]\\\\n\\\\n{prompt}"
        
        self.history.append({"role": "user", "content": actual_prompt})
        
        if self.provider == "cloudflare":
            url = f"{self.app_origin}/api/cloudflare/{self.model}"
            headers = {
                "X-CF-Account-ID": self.account_id,
                "X-CF-API-Token": self.api_key,
                "Content-Type": "application/json"
            }
            payload = {"messages": self.history, "max_tokens": 2048}
            
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                response.raise_for_status()
                res_data = response.json()
                if 'result' in res_data and 'response' in res_data['result']:
                    reply = res_data['result']['response']
                    self.history.append({"role": "assistant", "content": reply})
                    return reply
                return str(res_data)
            except Exception as e:
                self.history.pop() # remove failed message
                return f"Error: {str(e)}"
        else:
            url = f"{self.openai_base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {"model": self.model, "messages": self.history, "max_tokens": 2048}
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                response.raise_for_status()
                res_data = response.json()
                if 'choices' in res_data and len(res_data['choices']) > 0:
                    reply = res_data['choices'][0]['message']['content']
                    self.history.append({"role": "assistant", "content": reply})
                    return reply
                return str(res_data)
            except Exception as e:
                self.history.pop()
                return f"Error: {str(e)}"

def main():
    PROVIDER = "\\\${provider}"
    ACCOUNT_ID = "\\\${accountId}"
    API_KEY = "\\\${token}"
    APP_ORIGIN = "\\\${urlOrigin}"
    OPENAI_BASE = "\\\${baseUrl}"
    MODEL = "\\\${model}"

    client = AIClient(PROVIDER, API_KEY, ACCOUNT_ID, APP_ORIGIN, OPENAI_BASE, MODEL)
    
    while True:
        clear_screen()
        print(LOGO)
        print(f"\\\\033[1;32mProvider:\\\\033[0m {PROVIDER.upper()}")
        print(f"\\\\033[1;32mModel Aktif:\\\\033[0m {client.model}")
        print("\\\\033[1;34m====================================================\\\\033[0m")
        print("Menu:")
        print("1. Chat dengan AI")
        print("2. Ganti Model")
        print("3. Clear History (Reset Context)")
        print("4. Keluar")
        print("\\\\033[1;34m====================================================\\\\033[0m")
        
        pilihan = input("\\\\033[1;36mPilih menu (1-4): \\\\033[0m")
        
        if pilihan == '1':
            clear_screen()
            print(LOGO)
            print(f"\\\\033[1;32mChat Mode - Model: {client.model}\\\\033[0m")
            print("\\\\033[3m(Ketik 'kembali' untuk ke menu utama)\\\\033[0m\\\\n")
            
            # Print history
            for msg in client.history:
                if msg['role'] == 'user':
                    # Hide system context from history print
                    content = msg['content'].split(']\\\\n\\\\n')[-1] if '[System Context:' in msg['content'] else msg['content']
                    print(f"\\\\n\\\\033[1;34m[You]:\\\\033[0m {content}")
                elif msg['role'] == 'assistant':
                    print(f"\\\\033[1;32m[AI]:\\\\033[0m {msg['content']}")
                    
            while True:
                try:
                    user_input = input("\\\\n\\\\033[1;34m[You]:\\\\033[0m ")
                    if user_input.lower() == 'kembali':
                        break
                    if not user_input.strip():
                        continue
                        
                    print("\\\\033[1;33m[AI]:\\\\033[0m \\\\033[3mMengetik...\\\\033[0m", end="\\\\r")
                    reply = client.send_message(user_input)
                    # Clear the "Mengetik..." line
                    print(" " * 50, end="\\\\r")
                    print(f"\\\\033[1;32m[AI]:\\\\033[0m {reply}")
                except KeyboardInterrupt:
                    break
                except EOFError:
                    break
        elif pilihan == '2':
            new_model = input(f"\\\\033[1;36mMasukkan nama model baru (sekarang: {client.model}): \\\\033[0m")
            if new_model.strip():
                client.model = new_model.strip()
                print(f"\\\\033[1;32m[+] Model berhasil diubah ke {client.model}\\\\033[0m")
                input("Tekan Enter untuk lanjut...")
        elif pilihan == '3':
            client.history = []
            print("\\\\033[1;32m[+] History percakapan dihapus.\\\\033[0m")
            input("Tekan Enter untuk lanjut...")
        elif pilihan == '4':
            print("\\\\033[1;32mSampai jumpa!\\\\033[0m")
            break

if __name__ == "__main__":
    main()
\\\`;
    
    const bashScript = \\\`#!/bin/bash
echo -e "\\\\\\\\e[1;36m[*] Menyiapkan environment API...\\\\\\\\e[0m"

# Deteksi Termux vs VPS Linux
if [ -n "$PREFIX" ] && [ -d "$PREFIX/usr/bin" ]; then
    echo -e "\\\\\\\\e[1;34m[*] Lingkungan Termux terdeteksi.\\\\\\\\e[0m"
    pkg update -y
    pkg install -y python python-pip
    pip install requests
else
    echo -e "\\\\\\\\e[1;34m[*] Lingkungan Linux/VPS terdeteksi.\\\\\\\\e[0m"
    if command -v apt-get >/dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    elif command -v yum >/dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v pacman >/dev/null; then
        sudo pacman -Sy --noconfirm python python-pip
    else
        echo -e "\\\\\\\\e[1;33m[!] Package manager tidak terdeteksi otomatis, pastikan Python3 terinstall.\\\\\\\\e[0m"
    fi
    pip3 install requests --break-system-packages 2>/dev/null || pip3 install requests
fi

echo -e "\\\\\\\\e[1;36m[*] Membuat file test_ai.py...\\\\\\\\e[0m"
cat << 'INNER_EOF' > test_ai.py
\\\${pythonScript}
INNER_EOF

echo -e "\\\\\\\\e[1;32m[+] Selesai! Menjalankan antarmuka CLI...\\\\\\\\e[0m"
if command -v python3 >/dev/null; then
    python3 test_ai.py
else
    python test_ai.py
fi\\\`;

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
