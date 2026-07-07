import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory mock for Cloudflare KV to store users
  const usersMockKV: Array<{ name: string; accountId: string; token: string }> = [
    { name: 'Admin User', accountId: 'default-admin-id', token: 'default-token' },
    { name: 'Guest User', accountId: 'guest-id-1234', token: 'guest-token' },
    { name: 'System Log', accountId: 'sys-log-5678', token: 'sys-token' }
  ];

  // In-memory logs for Dashboard
  const requestLogs: Array<any> = [];

  app.get("/api/users", (req, res) => {
    res.json(usersMockKV);
  });

  app.post("/api/users", (req, res) => {
    const { name, accountId, token } = req.body;
    if (!name || !accountId || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingIndex = usersMockKV.findIndex(u => u.accountId === accountId);
    if (existingIndex !== -1) {
      usersMockKV[existingIndex] = { name, accountId, token };
    } else {
      usersMockKV.push({ name, accountId, token });
    }
    res.json({ success: true, user: { name, accountId, token } });
  });

  // Get Logs for Dashboard
  app.get("/api/logs", (req, res) => {
    res.json(requestLogs.slice(0, 50)); // Return last 50 logs
  });

  // Verify Token
  app.get("/api/verify-token", async (req, res) => {
    const token = req.headers['authorization'] || req.query.token;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const cleanToken = (token as string).replace('Bearer ', '');
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch Models
  app.get("/api/models", async (req, res) => {
    const accountId = req.query.accountId;
    const token = req.headers['authorization'] || req.query.token;
    
    if (!accountId || !token) {
      return res.status(400).json({ error: 'Missing accountId or token' });
    }

    const cleanToken = (token as string).replace('Bearer ', '');
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API route to proxy Cloudflare requests (Standard AI Run Endpoint)
  // This is the URL that both Web and VPS/Termux will hit!
  app.post("/api/cloudflare/:model(*)", async (req, res) => {
    const model = req.params.model || req.body.model;
    const accountId = req.headers['x-cf-account-id'] || req.body.accountId;
    const token = req.headers['x-cf-api-token'] || req.body.token;
    const prompt = req.body.prompt || (req.body.messages && req.body.messages[0]?.content);
    
    // Cloudflare standard body structure
    const bodyPayload = req.body.messages ? req.body : {
      messages: [{ role: "user", content: prompt }],
      max_tokens: req.body.maxTokens || req.body.max_tokens || 256
    };

    if (!accountId || !token || !model) {
      return res.status(400).json({ error: "Missing required fields (accountId, token, model)" });
    }

    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await response.json();
      const latency = Date.now() - startTime;
      
      // Save log internally
      requestLogs.unshift({
        time: new Date().toLocaleTimeString(),
        model,
        prompt: prompt || 'Custom payload',
        latency,
        status: response.status,
        source: req.headers['user-agent']?.includes('python-requests') ? 'VPS/Termux' : 'Web UI'
      });
      res.status(response.status).json(data);
    } catch (error: any) {
      const latency = Date.now() - startTime;
      requestLogs.unshift({
        time: new Date().toLocaleTimeString(),
        model,
        prompt: prompt || 'Custom payload',
        latency,
        status: 500,
        source: req.headers['user-agent']?.includes('python-requests') ? 'VPS/Termux' : 'Web UI'
      });
      res.status(500).json({ error: error.message });
    }
  });

  // API route to proxy OpenAI compatible API requests
  app.post("/api/openai/chat/completions", async (req, res) => {
    const accountId = req.headers['x-cf-account-id'] || req.body.accountId;
    const token = req.headers['x-cf-api-token'] || req.body.token;
    const model = req.body.model;
    
    if (!accountId || !token || !model) {
      return res.status(400).json({ error: "Missing required fields (accountId, token, model)" });
    }

    // Pass through the exact same body but remove our custom fields
    const bodyPayload = { ...req.body };
    delete bodyPayload.accountId;
    delete bodyPayload.token;

    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await response.json();
      const latency = Date.now() - startTime;
      
      requestLogs.unshift({
        time: new Date().toLocaleTimeString(),
        model,
        prompt: req.body.messages?.[0]?.content || 'OpenAI Payload',
        latency,
        status: response.status,
        source: req.headers['user-agent']?.includes('python-requests') ? 'VPS/Termux (OpenAI API)' : 'Web UI (OpenAI API)'
      });
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Installation Script Generator for VPS/Termux
  app.get("/api/install", (req, res) => {
    // Determine if it's hono (c) or express (req, res)
    const isHono = typeof res === 'undefined';
    const c = isHono ? req : null;
    
    const query = isHono ? (key) => c.req.query(key) : (key) => req.query[key];
    const header = isHono ? (key) => c.req.header(key) : (key) => req.headers[key.toLowerCase()];
    const urlOrigin = isHono ? new URL(c.req.url).origin : `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.get('host')}`;
    
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
      
      pythonScript = `import requests
from typing import Optional, Dict, Any

class CloudflareAI:
    def __init__(self, account_id: str, api_token: str):
        self.account_id = account_id
        self.api_token = api_token
        self.base_url = f"${urlOrigin}/api/cloudflare/"
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
    ACCOUNT_ID = "${accountId}"
    API_TOKEN = "${token}"
    MODEL = "${model}"
    
    ai_client = CloudflareAI(account_id=ACCOUNT_ID, api_token=API_TOKEN)
    
    print(f"[*] Mengirim permintaan melalui API Gateway (${urlOrigin})...")
    hasil = ai_client.run_model(model=MODEL, prompt="Sapa saya dalam satu kalimat bahasa Indonesia.")
    
    if hasil and 'result' in hasil:
        print("\\n[+] Response AI:\\n")
        res_data = hasil['result']
        if isinstance(res_data, dict) and 'response' in res_data:
            print(res_data['response'])
        else:
            print(res_data)
    else:
        print("\\n[-] Gagal mendapatkan respons.")`;
    } else {
      const token = query('token');
      const baseUrl = query('baseUrl') || 'https://api.openai.com/v1';
      const model = query('model') || 'gpt-4o';
      
      if (!token) {
        if (isHono) return c.text("echo 'Error: Missing token in URL'", 400);
        return res.status(400).send("echo 'Error: Missing token in URL'");
      }
      
      pythonScript = `import requests
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
    API_KEY = "${token}"
    BASE_URL = "${baseUrl}"
    MODEL = "${model}"
    
    ai_client = OpenAIClient(api_key=API_KEY, base_url=BASE_URL)
    
    print(f"[*] Mengirim permintaan ke OpenAI Compatible Endpoint (${BASE_URL})...")
    hasil = ai_client.run_model(model=MODEL, prompt="Sapa saya dalam satu kalimat bahasa Indonesia.")
    
    if hasil and 'choices' in hasil and len(hasil['choices']) > 0:
        print("\\n[+] Response AI:\\n")
        print(hasil['choices'][0]['message']['content'])
    else:
        print("\\n[-] Gagal mendapatkan respons. Raw output:", hasil)`;
    }
    
    const bashScript = `#!/bin/bash
echo -e "\\e[1;36m[*] Menyiapkan environment API...\\e[0m"

# Deteksi Termux vs VPS Linux
if [ -n "$PREFIX" ] && [ -d "$PREFIX/usr/bin" ]; then
    echo -e "\\e[1;34m[*] Lingkungan Termux terdeteksi.\\e[0m"
    pkg update -y
    pkg install -y python python-pip
    pip install requests
else
    echo -e "\\e[1;34m[*] Lingkungan Linux/VPS terdeteksi.\\e[0m"
    if command -v apt-get >/dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    elif command -v yum >/dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v pacman >/dev/null; then
        sudo pacman -Sy --noconfirm python python-pip
    else
        echo -e "\\e[1;33m[!] Package manager tidak terdeteksi otomatis, pastikan Python3 terinstall.\\e[0m"
    fi
    pip3 install requests --break-system-packages 2>/dev/null || pip3 install requests
fi

echo -e "\\e[1;36m[*] Membuat file test_ai.py...\\e[0m"
cat << 'INNER_EOF' > test_ai.py
${pythonScript}
INNER_EOF

echo -e "\\e[1;32m[+] Selesai! Menjalankan uji coba skrip...\\e[0m"
if command -v python3 >/dev/null; then
    python3 test_ai.py
else
    python test_ai.py
fi`;

    if (isHono) return c.text(bashScript);
    res.setHeader('Content-Type', 'text/plain');
    res.send(bashScript);});

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
