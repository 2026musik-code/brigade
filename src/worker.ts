import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  userkey: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health check endpoint
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Helper to get logs from KV
async function getLogs(kv: KVNamespace) {
  try {
    const logsStr = await kv.get('system_logs');
    return logsStr ? JSON.parse(logsStr) : [];
  } catch (e) {
    return [];
  }
}

// Helper to save log
async function saveLog(kv: KVNamespace, logEntry: any) {
  try {
    let logs = await getLogs(kv);
    logs.unshift(logEntry);
    logs = logs.slice(0, 50); // Keep last 50
    await kv.put('system_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save log', e);
  }
}

// Get Users from KV
app.get('/api/users', async (c) => {
  try {
    const usersStr = await c.env.userkey.get('users_list');
    let users = usersStr ? JSON.parse(usersStr) : [];
    
    // Default users if empty
    if (users.length === 0) {
      users = [
        { name: 'Admin User', accountId: '', token: '' }
      ];
      await c.env.userkey.put('users_list', JSON.stringify(users));
    }
    return c.json(users);
  } catch (error) {
    return c.json([], 200); // return empty array on error
  }
});

// Save User to KV
app.post('/api/users', async (c) => {
  try {
    const { name, accountId, token } = await c.req.json();
    if (!name || !accountId || !token) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const usersStr = await c.env.userkey.get('users_list');
    let users = usersStr ? JSON.parse(usersStr) : [];
    
    const existingIndex = users.findIndex((u: any) => u.accountId === accountId);
    if (existingIndex !== -1) {
      users[existingIndex] = { name, accountId, token };
    } else {
      users.push({ name, accountId, token });
    }
    
    await c.env.userkey.put('users_list', JSON.stringify(users));
    return c.json({ success: true, user: { name, accountId, token } });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Verify Token
app.get('/api/verify-token', async (c) => {
  const token = c.req.header('Authorization') || c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 400);

  const cleanToken = token.replace('Bearer ', '');
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Fetch Models
app.get('/api/models', async (c) => {
  const accountId = c.req.query('accountId');
  const token = c.req.header('Authorization') || c.req.query('token');
  
  if (!accountId || !token) {
    return c.json({ error: 'Missing accountId or token' }, 400);
  }

  const cleanToken = token.replace('Bearer ', '');
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search`, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get Logs for Dashboard
app.get('/api/logs', async (c) => {
  if (!c.env.userkey) return c.json([]);
  const logs = await getLogs(c.env.userkey);
  return c.json(logs);
});

// Cloudflare AI Proxy API Endpoint
// Ini akan memproses request baik dari Web UI maupun script Python/VPS
app.post('/api/cloudflare/:model{.*}', async (c) => {
  const model = c.req.param('model');
  
  // Ambil kredensial dari Header (VPS/Termux) atau dari Body (Web UI)
  const accountId = c.req.header('x-cf-account-id');
  const token = c.req.header('x-cf-api-token');
  
  // Parse body
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const finalAccountId = accountId || body.accountId;
  const finalToken = token || body.token;
  const prompt = body.prompt || (body.messages && body.messages[0]?.content);

  if (!finalAccountId || !finalToken || !model) {
    return c.json({ error: 'Missing required fields (accountId, token, model)' }, 400);
  }

  // Format payload sesuai standar Cloudflare AI API
  const bodyPayload = body.messages ? body : {
    messages: [{ role: "user", content: prompt }],
    max_tokens: body.maxTokens || body.max_tokens || 256
  };

  const startTime = Date.now();
  try {
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${finalAccountId}/ai/run/${model}`;
    
    // Meneruskan request ke API Cloudflare AI
    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${finalToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });
    
    const data = await response.json();
    const latency = Date.now() - startTime;
    
    // Save log asynchronously so it doesn't block response
    if (c.env.userkey && c.executionCtx) {
      const userAgent = c.req.header('user-agent') || '';
      const source = userAgent.includes('python-requests') || userAgent.includes('curl') ? 'VPS/Termux' : 'Web UI';
      
      c.executionCtx.waitUntil(saveLog(c.env.userkey, {
        time: new Date().toLocaleTimeString(),
        model,
        prompt: prompt || 'Custom payload',
        latency,
        status: response.status,
        source
      }));
    }

    return c.json(data, response.status as any);
    
  } catch (error: any) {
    const latency = Date.now() - startTime;
    if (c.env.userkey && c.executionCtx) {
      const userAgent = c.req.header('user-agent') || '';
      const source = userAgent.includes('python-requests') || userAgent.includes('curl') ? 'VPS/Termux' : 'Web UI';
      
      c.executionCtx.waitUntil(saveLog(c.env.userkey, {
        time: new Date().toLocaleTimeString(),
        model,
        prompt: prompt || 'Custom payload',
        latency,
        status: 500,
        source
      }));
    }
    return c.json({ error: error.message }, 500);
  }
});

  // API route to proxy OpenAI compatible API requests
  app.post("/api/openai/chat/completions", async (c) => {
    const accountId = c.req.header('x-cf-account-id') || c.req.query('accountId');
    const token = c.req.header('x-cf-api-token') || c.req.query('token');
    let body: any = {};
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }
    
    const finalAccountId = accountId || body.accountId;
    const finalToken = token || body.token;
    const model = body.model;
    
    if (!finalAccountId || !finalToken || !model) {
      return c.json({ error: 'Missing required fields (accountId, token, model)' }, 400);
    }

    // Pass through the exact same body but remove our custom fields
    const bodyPayload = { ...body };
    delete bodyPayload.accountId;
    delete bodyPayload.token;

    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${finalAccountId}/ai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${finalToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await response.json();
      const latency = Date.now() - startTime;
      
      if (c.env.userkey && c.executionCtx) {
        const userAgent = c.req.header('user-agent') || '';
        const source = userAgent.includes('python-requests') || userAgent.includes('curl') ? 'VPS/Termux (OpenAI API)' : 'Web UI (OpenAI API)';
        
        c.executionCtx.waitUntil(saveLog(c.env.userkey, {
          time: new Date().toLocaleTimeString(),
          model,
          prompt: body.messages?.[0]?.content || 'OpenAI Payload',
          latency,
          status: response.status,
          source
        }));
      }
      return c.json(data, response.status as any);
    } catch (error: any) {
      const latency = Date.now() - startTime;
      if (c.env.userkey && c.executionCtx) {
        const userAgent = c.req.header('user-agent') || '';
        const source = userAgent.includes('python-requests') || userAgent.includes('curl') ? 'VPS/Termux (OpenAI API)' : 'Web UI (OpenAI API)';
        
        c.executionCtx.waitUntil(saveLog(c.env.userkey, {
          time: new Date().toLocaleTimeString(),
          model,
          prompt: body.messages?.[0]?.content || 'OpenAI Payload',
          latency,
          status: 500,
          source
        }));
      }
      return c.json({ error: error.message }, 500);
    }
  });

  // Endpoint untuk Generate Script Instalasi
app.get("/api/install", (req) => {
    const res = undefined;
    // Determine if it's hono (c) or express (req, res)
    const isHono = typeof res === 'undefined';
    const c = isHono ? req : null;
    
    const query = isHono ? (key) => c.req.query(key) : (key) => req.query[key];
    const header = isHono ? (key) => c.req.header(key) : (key) => req.headers[key.toLowerCase()];
    const urlOrigin = isHono ? new URL(c.req.url).origin : `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.get('host')}`;
    
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
      
    const pythonScript = `import requests
import json
import os
import sys
import platform
import subprocess
from typing import Optional, Dict, Any

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

LOGO = r"""
\\033[1;36m
   ___ _                 _  __ _                  _    ___ 
  / __\\ | ___  _   _  __| |/ _| | __ _ _ __ ___  / \\  |_ _|
 / /  | |/ _ \\| | | |/ _\\_ | |_| |/ _\\_ | '__/ _ \\/ _ \\  | | 
/ /___| | (_) | |_| | (_| |  _| | (_| | | |  __/ ___ \\ | | 
\\____/|_|\\___/ \\__,_|\\__,_|_| |_|\\__,_|_|  \\__/_/   \\_\\___|
\\033[0m
\\033[1;33m       Professional AI CLI Interface       \\033[0m
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
                    info += f"\\n[RAM Info]:\\n{out}"
                except:
                    pass
                try:
                    df = subprocess.check_output("df -h /", shell=True, stderr=subprocess.DEVNULL).decode().strip()
                    info += f"\\n[Disk Info]:\\n{df}"
                except:
                    pass
            return info
        except:
            return "System info not available"

    def send_message(self, prompt: str):
        actual_prompt = prompt
        if not self.history:
            sys_info = self.get_sys_info()
            actual_prompt = f"[System Context: You are a CLI AI Assistant. User System: {sys_info}]\\n\\n{prompt}"
        
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
    PROVIDER = "${provider}"
    ACCOUNT_ID = "${accountId}"
    API_KEY = "${token}"
    APP_ORIGIN = "${urlOrigin}"
    OPENAI_BASE = "${baseUrl}"
    MODEL = "${model}"

    client = AIClient(PROVIDER, API_KEY, ACCOUNT_ID, APP_ORIGIN, OPENAI_BASE, MODEL)
    
    while True:
        clear_screen()
        print(LOGO)
        print(f"\\033[1;32mProvider:\\033[0m {PROVIDER.upper()}")
        print(f"\\033[1;32mModel Aktif:\\033[0m {client.model}")
        print("\\033[1;34m====================================================\\033[0m")
        print("Menu:")
        print("1. Chat dengan AI")
        print("2. Ganti Model")
        print("3. Clear History (Reset Context)")
        print("4. Keluar")
        print("\\033[1;34m====================================================\\033[0m")
        
        pilihan = input("\\033[1;36mPilih menu (1-4): \\033[0m")
        
        if pilihan == '1':
            clear_screen()
            print(LOGO)
            print(f"\\033[1;32mChat Mode - Model: {client.model}\\033[0m")
            print("\\033[3m(Ketik 'kembali' untuk ke menu utama)\\033[0m\\n")
            
            # Print history
            for msg in client.history:
                if msg['role'] == 'user':
                    # Hide system context from history print
                    content = msg['content'].split(']\\n\\n')[-1] if '[System Context:' in msg['content'] else msg['content']
                    print(f"\\n\\033[1;34m[You]:\\033[0m {content}")
                elif msg['role'] == 'assistant':
                    print(f"\\033[1;32m[AI]:\\033[0m {msg['content']}")
                    
            while True:
                try:
                    user_input = input("\\n\\033[1;34m[You]:\\033[0m ")
                    if user_input.lower() == 'kembali':
                        break
                    if not user_input.strip():
                        continue
                        
                    print("\\033[1;33m[AI]:\\033[0m \\033[3mMengetik...\\033[0m", end="\\r")
                    reply = client.send_message(user_input)
                    # Clear the "Mengetik..." line
                    print(" " * 50, end="\\r")
                    print(f"\\033[1;32m[AI]:\\033[0m {reply}")
                except KeyboardInterrupt:
                    break
                except EOFError:
                    break
        elif pilihan == '2':
            new_model = input(f"\\033[1;36mMasukkan nama model baru (sekarang: {client.model}): \\033[0m")
            if new_model.strip():
                client.model = new_model.strip()
                print(f"\\033[1;32m[+] Model berhasil diubah ke {client.model}\\033[0m")
                input("Tekan Enter untuk lanjut...")
        elif pilihan == '3':
            client.history = []
            print("\\033[1;32m[+] History percakapan dihapus.\\033[0m")
            input("Tekan Enter untuk lanjut...")
        elif pilihan == '4':
            print("\\033[1;32mSampai jumpa!\\033[0m")
            break

if __name__ == "__main__":
    main()
`;
    
    const bashScript = `#!/bin/bash
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
${pythonScript}
INNER_EOF

echo -e "\\\\e[1;32m[+] Selesai! Menjalankan antarmuka CLI...\\\\e[0m"
if command -v python3 >/dev/null; then
    python3 test_ai.py
else
    python test_ai.py
fi`;

    if (isHono) return c.text(bashScript);
    res.setHeader('Content-Type', 'text/plain');
    res.send(bashScript);});

export default app;
