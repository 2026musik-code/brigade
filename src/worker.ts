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

// Endpoint untuk Generate Script Instalasi
app.get('/api/install', (c) => {
  const accountId = c.req.query('accountId');
  const token = c.req.query('token');
  const model = c.req.query('model') || "@cf/meta/llama-3.1-8b-instruct";
  
  if (!accountId || !token) {
    return c.text("echo 'Error: Missing accountId or token in URL'", 400);
  }

  // Karena ini berjalan di Cloudflare Worker, host adalah URL Worker ini sendiri
  const appUrl = new URL(c.req.url).origin;

  const pythonScript = \`import requests
from typing import Optional, Dict, Any

class CloudflareAI:
    def __init__(self, account_id: str, api_token: str):
        self.account_id = account_id
        self.api_token = api_token
        # Menembak ke Worker API kita sendiri
        self.base_url = f"\${appUrl}/api/cloudflare/"
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
    
    print(f"[*] Mengirim permintaan melalui API Worker (\${appUrl})...")
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

  const bashScript = \`#!/bin/bash
echo -e "\\\\e[1;36m[*] Menyiapkan environment CFAI API (Hono Worker)...\\\\e[0m"

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

echo -e "\\\\e[1;36m[*] Membuat file cloudflare_ai.py...\\\\e[0m"
cat << 'EOF' > cloudflare_ai.py
\${pythonScript}
EOF

echo -e "\\\\e[1;32m[+] Selesai! Menjalankan uji coba skrip...\\\\e[0m"
if command -v python3 >/dev/null; then
    python3 cloudflare_ai.py
else
    python cloudflare_ai.py
fi
\`;

  return c.text(bashScript);
});

export default app;
