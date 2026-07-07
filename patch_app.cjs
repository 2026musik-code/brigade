const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add OPENAI_MODELS
const openaiModels = `const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "o1-preview",
  "o1-mini",
  "claude-3-5-sonnet-20241022",
  "deepseek-chat",
  "deepseek-reasoner",
  "openai/gpt-5.5"
];\n\n`;
content = content.replace('const MODELS = [', openaiModels + 'const MODELS = [');

// 2. Add new states
const states = `  const [apiProvider, setApiProvider] = useState<'cloudflare' | 'openai'>('cloudflare');
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState("https://api.openai.com/v1");
  const [openaiModel, setOpenaiModel] = useState(OPENAI_MODELS[0]);
  const [customOpenaiModel, setCustomOpenaiModel] = useState("");\n`;
content = content.replace('const [accountId, setAccountId] = useState("");', states + '  const [accountId, setAccountId] = useState("");');

// 3. Add Provider Tabs
const providerTabs = `
            {/* Provider Selection */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex mb-6">
               <button 
                 onClick={() => setApiProvider('cloudflare')}
                 className={\`flex-1 py-2 text-sm font-medium rounded-lg transition-colors \${apiProvider === 'cloudflare' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'}\`}
               >
                 Cloudflare AI
               </button>
               <button 
                 onClick={() => setApiProvider('openai')}
                 className={\`flex-1 py-2 text-sm font-medium rounded-lg transition-colors \${apiProvider === 'openai' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}\`}
               >
                 OpenAI Compatible
               </button>
            </div>
`;
content = content.replace('            {/* Konfigurasi API */}', providerTabs + '            {/* Konfigurasi API */}');

// 4. Update Run / Test Logic
const testApiFunctionRegex = /const handleTestApi = async \(\) => \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/;

const newTestApiLogic = `const handleTestApi = async () => {
    setIsLoading(true);
    setTestResult(null);
    setCopied(false);
    
    try {
      if (apiProvider === 'cloudflare') {
        if (!accountId || !apiToken) throw new Error("Account ID dan Token diperlukan untuk Cloudflare AI");
        const response = await fetch(\`/api/cloudflare/\${model}\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cf-account-id": accountId,
            "x-cf-api-token": apiToken
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            max_tokens: 256
          })
        });
        const data = await response.json();
        setTestResult({ status: response.status, data });
      } else {
        if (!openaiKey) throw new Error("API Key diperlukan untuk OpenAI");
        const activeModel = customOpenaiModel || openaiModel;
        
        // Proxying it through our server to avoid CORS
        const response = await fetch('/api/openai/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: openaiBaseUrl,
            token: openaiKey,
            model: activeModel,
            prompt: prompt,
            maxTokens: 256
          })
        });
        const data = await response.json();
        setTestResult({ status: response.status, data });
      }
    } catch (err: any) {
      setTestResult({ status: 500, data: { error: err.message } });
    } finally {
      setIsLoading(false);
    }
  };`;
content = content.replace(testApiFunctionRegex, newTestApiLogic);

// 5. Replace API inputs based on Provider
const inputsHtmlRegex = /<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">[\s\S]*?(?=<\/div>\s*<\/div>\s*<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">)/;

const newInputsHtml = `<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4 text-orange-600">
                <Key size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Kredensial API {apiProvider === 'cloudflare' ? '(Cloudflare)' : '(OpenAI)'}</h2>
              </div>
              
              {apiProvider === 'cloudflare' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        placeholder="Contoh: 32f9d5fc..."
                      />
                      <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={apiToken}
                        onChange={(e) => {
                          setApiToken(e.target.value);
                          setTokenStatus('idle');
                          setTokenError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                      />
                      <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <button 
                        onClick={handleVerifyToken}
                        disabled={!apiToken || tokenStatus === 'verifying'}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center gap-1"
                      >
                        {tokenStatus === 'verifying' ? 'Memverifikasi...' : 'Verifikasi Token'}
                      </button>
                      {tokenStatus === 'valid' && <span className="text-xs font-medium text-green-600 flex items-center gap-1"><Check size={14}/> Valid</span>}
                      {tokenStatus === 'invalid' && <span className="text-xs font-medium text-red-600 flex items-center gap-1"><X size={14}/> Tidak Valid</span>}
                    </div>
                    {tokenError && <p className="text-xs text-red-500 mt-1">{tokenError}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={openaiBaseUrl}
                        onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="https://api.openai.com/v1"
                      />
                      <Server size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="sk-..."
                      />
                      <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
`;
content = content.replace(inputsHtmlRegex, newInputsHtml);

// 6. Replace Models section
const modelsRegex = /<div className="space-y-4">\s*<div>\s*<div className="flex items-center justify-between mb-1">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">/;

const newModelsHtml = `<div className="space-y-4">
              <div>
                {apiProvider === 'cloudflare' ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Model AI</label>
                      <button
                        onClick={handleFetchModels}
                        disabled={isFetchingModels || !accountId || !apiToken}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center gap-1"
                      >
                        {isFetchingModels ? 'Memuat...' : 'Muat dari API'}
                      </button>
                    </div>
                    <select 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model (OpenAI)</label>
                    <select 
                      value={openaiModel}
                      onChange={(e) => {
                        setOpenaiModel(e.target.value);
                        if (e.target.value !== 'custom') setCustomOpenaiModel('');
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors mb-2"
                    >
                      {OPENAI_MODELS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="custom">Custom Model...</option>
                    </select>
                    {openaiModel === 'custom' && (
                      <input 
                        type="text" 
                        value={customOpenaiModel}
                        onChange={(e) => setCustomOpenaiModel(e.target.value)}
                        placeholder="Masukkan nama model (contoh: llama-3-8b)"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}
                  </>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Uji Coba</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">`;
content = content.replace(modelsRegex, newModelsHtml);


// 7. Update generator link URL logic
const genLinkRegex = /const installUrl = new URL\(window\.location\.href\);\s*installUrl\.pathname = '\/api\/install';\s*installUrl\.searchParams\.set\('accountId', accountId\);\s*installUrl\.searchParams\.set\('token', apiToken\);\s*installUrl\.searchParams\.set\('model', model\);/;

const newGenLink = `const installUrl = new URL(window.location.href);
    installUrl.pathname = '/api/install';
    if (apiProvider === 'cloudflare') {
      installUrl.searchParams.set('provider', 'cloudflare');
      installUrl.searchParams.set('accountId', accountId);
      installUrl.searchParams.set('token', apiToken);
      installUrl.searchParams.set('model', model);
    } else {
      installUrl.searchParams.set('provider', 'openai');
      installUrl.searchParams.set('token', openaiKey);
      installUrl.searchParams.set('baseUrl', openaiBaseUrl);
      installUrl.searchParams.set('model', customOpenaiModel || openaiModel);
    }`;
content = content.replace(genLinkRegex, newGenLink);


fs.writeFileSync('src/App.tsx', content);
