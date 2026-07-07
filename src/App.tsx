import React, { useState } from 'react';
import { Play, Copy, Terminal, Server, Key, Brain, FileCode2, Check, ExternalLink, User, Activity, TerminalSquare, X, CloudFog, Search , LayoutDashboard, FileText, Users} from 'lucide-react';
import { motion } from 'motion/react';
import copy from 'copy-to-clipboard';

const OPENAI_MODELS = [
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
];

const MODELS = [
  // Llama Series (Latest)
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.2-11b-vision-instruct",
  "@cf/meta/llama-3.2-3b-instruct",
  "@cf/meta/llama-3.2-1b-instruct",
  "@cf/meta/llama-3.1-8b-instruct-fp8",
  "@cf/meta/llama-guard-3-8b",
  // OpenAI Open-Weight Series
  "@cf/openai/gpt-oss-120b",
  "@cf/openai/gpt-oss-20b",
  // DeepSeek
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
  "@cf/deepseek-ai/deepseek-math-7b-instruct",
  "@cf/deepseek-ai/deepseek-coder-6.7b-instruct",
  // Qwen (Latest)
  "@cf/qwen/qwq-32b",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/qwen/qwen2.5-coder-32b-instruct",
  // Google Gemma
  "@cf/google/gemma-4-26b-a4b-it",
  "@cf/google/gemma-7b-it-lora",
  "@cf/google/gemma-2b-it-lora",
  // Mistral
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.2-lora",
  // Others
  "@cf/moonshotai/kimi-k2.7-code",
  "@cf/zai-org/glm-5.2",
  "@cf/nvidia/nemotron-3-120b-a12b",
  "@cf/ibm-granite/granite-4.0-h-micro"
];

export default function App() {
    const [apiProvider, setApiProvider] = useState<'cloudflare' | 'openai'>('cloudflare');
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState("https://api.openai.com/v1");
  const [openaiModel, setOpenaiModel] = useState(OPENAI_MODELS[0]);
  const [customOpenaiModel, setCustomOpenaiModel] = useState("");
  const [accountId, setAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [availableModels, setAvailableModels] = useState(MODELS);
  const [model, setModel] = useState(MODELS[0]);
  const [prompt, setPrompt] = useState("Sapa saya dalam satu kalimat bahasa Indonesia.");
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle'|'verifying'|'valid'|'invalid'>('idle');
  const [tokenError, setTokenError] = useState<string|null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Server Stats State
  const [currentView, setCurrentView] = useState<'generator' | 'user_select' | 'dashboard'>('generator');
  const [selectedUser, setSelectedUser] = useState<string>('Admin User');
  const [requestLogs, setRequestLogs] = useState<any[]>([]);
  const [trafficCount, setTrafficCount] = useState(0);
  const [pingLatency, setPingLatency] = useState(0);

  const [savedUsers, setSavedUsers] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users when opening user select view
  React.useEffect(() => {
    if (currentView === 'user_select') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSavedUsers(data);
          } else {
            console.error("Expected array from /api/users, got:", data);
            setSavedUsers([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch users:", err);
          setSavedUsers([]);
        });
    }
  }, [currentView]);

  const handleSaveUser = async () => {
    if (!newUserName || !accountId || !apiToken) return;
    setIsSavingUser(true);
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, accountId, token: apiToken })
      });
      setNewUserName('');
      alert('Profil berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan profil');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!apiToken) return;
    setTokenStatus('verifying');
    setTokenError(null);
    try {
      const response = await fetch('/api/verify-token', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success && data.result.status === 'active') {
        setTokenStatus('valid');
      } else {
        setTokenStatus('invalid');
        setTokenError(data.errors?.[0]?.message || 'Token tidak valid');
      }
    } catch (err: any) {
      setTokenStatus('invalid');
      setTokenError(err.message);
    }
  };

  const handleFetchModels = async () => {
    if (!accountId || !apiToken) return;
    setIsFetchingModels(true);
    try {
      const response = await fetch(`/api/models?accountId=${accountId}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const textModels = data.result
          .filter((m: any) => m.task.name === "Text Generation")
          .map((m: any) => m.name);
        if (textModels.length > 0) {
          setAvailableModels(textModels);
          setModel(textModels[0]);
          alert(`Berhasil memuat ${textModels.length} model Text Generation!`);
        } else {
          alert('Tidak ada model Text Generation yang ditemukan.');
        }
      } else {
        alert(data.errors?.[0]?.message || 'Gagal memuat model');
      }
    } catch (err: any) {
      alert('Error memuat model: ' + err.message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Reset generated link state when config changes
  React.useEffect(() => {
    setIsLinkGenerated(false);
  }, [accountId, apiToken, model]);

  const getInstallCommand = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `curl -sL "${origin}/api/install?accountId=${accountId}&token=${apiToken}&model=${encodeURIComponent(model)}" | bash`;
  };

  const copyInstallCommand = () => {
    try {
      copy(getInstallCommand());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleTestAPI = async () => {
    setIsTesting(true);
    setTestResult(null);
    const startTime = Date.now();
    try {
      const response = await fetch(`/api/cloudflare/${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountId, token: apiToken, model, prompt, maxTokens: 256 })
      });
      
      const latency = Date.now() - startTime;
      setPingLatency(latency);
      setTrafficCount(prev => prev + 1);
      
      const data = await response.json();
      setTestResult(data);
      
    } catch (error: any) {
      const latency = Date.now() - startTime;
      setPingLatency(latency);
      setTrafficCount(prev => prev + 1);
      setTestResult({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Fetch real-time logs from server
  React.useEffect(() => {
    if (currentView !== 'generator') return;
    
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setRequestLogs(data);
            // Hitung rata-rata ping dan total traffic dari log server jika mau lebih akurat
            // Tapi untuk sekarang kita tampilkan langsung
          }
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Polling every 3 seconds
    return () => clearInterval(interval);
  }, [currentView]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-indigo-100 selection:text-indigo-900" style={{ backgroundImage: "radial-gradient(at 0% 0%, hsla(253,16%,7deg,0.03) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30deg,0.03) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30deg,0.03) 0, transparent 50%)" }}>
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30">
            <Terminal size={20} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl tracking-tight">CFAI</h1>
            {currentView === 'user_select' && (
              <>
                <span className="text-slate-300 hidden sm:block">/</span>
                <span className="font-semibold text-lg tracking-tight text-slate-900 hidden sm:block">DASBOR USER</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="https://wa.me/627733745059" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:bg-green-50 text-green-600 p-2.5 rounded-xl transition-all duration-300 border border-green-200 shadow-sm hover:shadow hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="text-sm font-medium hidden sm:block">Hubungi Kami</span>
          </a>
        </div>
      </header>


      {currentView === 'generator' ? (
        <motion.main initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kontrol Kiri */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Server size={16} className="text-slate-400" />
              Konfigurasi API
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner"
                  />
                  <Server size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Token</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={apiToken}
                    onChange={(e) => {
                      setApiToken(e.target.value);
                      setTokenStatus('idle');
                      setTokenError(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner"
                  />
                  <Key size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button 
                    onClick={handleVerifyToken}
                    disabled={!apiToken || tokenStatus === 'verifying'}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 flex items-center gap-1"
                  >
                    {tokenStatus === 'verifying' ? 'Memverifikasi...' : 'Verifikasi Token'}
                  </button>
                  {tokenStatus === 'valid' && <span className="text-xs font-medium text-green-600 flex items-center gap-1"><Check size={14}/> Valid</span>}
                  {tokenStatus === 'invalid' && <span className="text-xs font-medium text-red-600 flex items-center gap-1"><X size={14}/> Tidak Valid</span>}
                </div>
                {tokenError && <p className="text-xs text-red-500 mt-1">{tokenError}</p>}
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Profil (Opsional untuk simpan ke KV)</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                  <input 
                    type="text"
                    placeholder="Contoh: Budi Cloudflare"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="flex-1 w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner transition-colors"
                  />
                  <button
                    onClick={handleSaveUser}
                    disabled={isSavingUser || !newUserName || !accountId || !apiToken}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-6 py-3 rounded-xl shadow-md hover:shadow-lg text-sm font-medium transition-colors border border-transparent shadow-sm whitespace-nowrap flex items-center justify-center"
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Brain size={16} className="text-slate-400" />
              Parameter Model
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Model AI</label>
                  <button
                    onClick={handleFetchModels}
                    disabled={isFetchingModels || !accountId || !apiToken}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 flex items-center gap-1"
                  >
                    {isFetchingModels ? 'Memuat...' : 'Muat dari API'}
                  </button>
                </div>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner transition-colors"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner transition-colors resize-none"
                />
              </div>

              <button 
                onClick={handleTestAPI}
                disabled={isTesting || !accountId || !apiToken || !prompt}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {isTesting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <Play size={16} />
                )}
                {isTesting ? 'Menguji API...' : 'Uji API Sekarang'}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Kanan - Skrip dan Hasil */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Hasil Test API */}
          {testResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <div className={`w-2 h-2 rounded-full ${testResult.success !== false && !testResult.error ? 'bg-green-500' : 'bg-red-500'}`} />
                  Hasil Pengujian API
                </div>
              </div>
              <div className="p-4 bg-slate-900 text-slate-300 font-mono text-sm overflow-x-auto max-h-[250px] overflow-y-auto">
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            </motion.div>
          )}

          {/* Code Viewer / Terminal Config */}
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col border border-slate-800">
            <div className="flex border-b border-slate-800 bg-slate-950">
              <div className="px-4 py-3 text-sm font-medium flex items-center gap-2 text-white border-b-2 border-indigo-500 bg-slate-900/50">
                <Terminal size={16} />
                Instalasi Terminal (VPS/Termux)
              </div>
            </div>

            <div className="flex-1 flex flex-col p-6 items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
                <Terminal size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Instalasi Otomatis</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                Jalankan perintah di bawah ini pada terminal VPS (Linux) atau Termux (Android) Anda. Skrip ini akan secara otomatis mengunduh, mengkonfigurasi file Python, serta menginstal dependensi yang dibutuhkan (Python3, pip, requests).
              </p>
              
              {!isLinkGenerated ? (
                  <button
                    onClick={() => setIsLinkGenerated(true)}
                    disabled={!accountId || !apiToken}
                    className="mx-auto bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-3 px-6 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <ExternalLink size={18} />
                    Hasilkan Link Instalasi
                  </button>
                ) : (
                  <div className="w-full max-w-2xl bg-black rounded-lg p-4 flex flex-col gap-3 text-left border border-slate-800">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      Bash Command
                    </div>
                    <code className="text-sm text-green-400 font-mono break-all font-medium leading-relaxed">
                      {getInstallCommand()}
                    </code>
                    <button 
                      onClick={copyInstallCommand}
                      className="mt-2 ml-auto text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-slate-700"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      {copied ? 'Tersalin ke Clipboard' : 'Salin Perintah'}
                    </button>
                  </div>
                )}
            </div>
          </div>
          
        </div>
      </motion.main>
      ) : currentView === 'user_select' ? (
        <motion.main initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-start min-h-[70vh] pt-2">
          
          {/* Search Bar */}
          <div className="w-full max-w-2xl mb-6 mt-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari server user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl text-base shadow-[0_8px_30px_rgb(0,0,0,0.06)] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-12 w-full max-w-4xl justify-items-center">
            {(savedUsers || []).filter(user => (user?.name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="text-slate-500 italic col-span-2 text-center">
                {searchQuery ? 'Pengguna tidak ditemukan.' : 'Belum ada pengguna yang disimpan.'}
              </div>
            ) : (
              (savedUsers || [])
                .filter(user => (user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
                .map((user, idx) => {
                // Different color gradients based on index
                const gradients = [
                  "from-blue-500 to-indigo-600",
                  "from-purple-500 to-pink-600",
                  "from-emerald-500 to-teal-600",
                  "from-indigo-500 to-red-600"
                ];
                const glowColors = [
                  "group-hover:shadow-blue-500/30",
                  "group-hover:shadow-purple-500/30",
                  "group-hover:shadow-emerald-500/30",
                  "group-hover:shadow-indigo-500/30"
                ];
                const gradient = gradients[idx % gradients.length];
                const glow = glowColors[idx % glowColors.length];

                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedUser(user.name);
                      if (user.accountId) setAccountId(user.accountId);
                      if (user.token) setApiToken(user.token);
                      setCurrentView('dashboard');
                    }}
                    className={`flex flex-col items-center cursor-pointer group w-full max-w-[240px]`}
                  >
                    <div className={`relative w-full aspect-square rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br ${gradient} p-[2px] sm:p-[3px] mb-4 sm:mb-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl ${glow}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[2rem] sm:rounded-[2.5rem] pointer-events-none mix-blend-overlay"></div>
                      <div className="w-full h-full rounded-[1.85rem] sm:rounded-[2.3rem] bg-white flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
                        {/* Soft background glow inside the card */}
                        <div className={`absolute -bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br ${gradient} opacity-10 blur-3xl rounded-full`}></div>
                        
                        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-lg text-white transform group-hover:scale-110 transition-transform duration-500`}>
                          <Server size={32} className="sm:w-10 sm:h-10 w-7 h-7" />
                        </div>
                        <span className="text-base sm:text-xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 transition-all text-center px-1 leading-tight">{user.name}</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-400 max-w-full truncate text-center mt-1 sm:mt-2 px-2" title={user.accountId}>{user.accountId}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.main>
      ) : (
      <motion.main initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-7xl mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white p-2 rounded-lg">
                <CloudFog size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Server Dashboard</h2>
                <p className="text-xs text-slate-500">Status & Analitik Penggunaan</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('user_select')}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-3 bg-[#0D1117] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-slate-300 font-medium text-sm flex items-center gap-2">
                      <Terminal size={16} className="text-slate-500" />
                      Perintah Instalasi Cepat
                    </div>
                    <button 
                      onClick={copyInstallCommand}
                      className="text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 border border-slate-700"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copied ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                  <code className="text-xs text-green-400 font-mono break-all bg-black/50 p-3 rounded-lg border border-slate-800/50 select-all">
                    {getInstallCommand()}
                  </code>
                </div>
                {/* Stats Cards */}
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                  <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Trafik Request</p>
                    <p className="text-2xl font-bold text-slate-900">{trafficCount}</p>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                  <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Ping API Cloudflare</p>
                    <p className="text-2xl font-bold text-slate-900">{pingLatency} ms</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Pengguna Aktif</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedUser}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sisa Token */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-medium text-sm flex items-center gap-2">
                    <Brain size={16} className="text-slate-500" />
                    Panel Request ke Model AI
                  </div>
                  <div className="p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="mb-3">
                      <select 
                        value={model} 
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {availableModels.map(m => (
                          <option key={m} value={m}>{m.split('/').pop()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 mb-3">
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ketik prompt..."
                        className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[60px]"
                      />
                    </div>
                    
                    {testResult && (
                      <div className="mb-3 flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 text-[10px] font-mono text-slate-700">
                        {testResult.error ? (
                           <span className="text-red-500">{testResult.error}</span>
                        ) : testResult.result?.response ? (
                           <span>{testResult.result.response}</span>
                        ) : (
                           <pre>{JSON.stringify(testResult, null, 2)}</pre>
                        )}
                      </div>
                    )}
                    
                    <button 
                      onClick={handleTestAPI}
                      disabled={isTesting || !accountId || !apiToken || !prompt}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors mt-auto shrink-0"
                    >
                      {isTesting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Play size={14} />
                      )}
                      {isTesting ? 'Mengirim...' : 'Kirim Request'}
                    </button>
                  </div>
                </div>

                {/* Terminal Log */}
                <div className="bg-[#0D1117] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[350px]">
                  <div className="px-5 py-3 border-b border-slate-800 bg-[#161B22] text-slate-300 font-medium text-sm flex items-center gap-2">
                    <TerminalSquare size={16} className="text-slate-500" />
                    Terminal Log Permintaan
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-3">
                    {requestLogs.length === 0 ? (
                      <div className="text-slate-500 italic">Belum ada riwayat permintaan...</div>
                    ) : (
                      requestLogs.map((log, i) => (
                        <div key={i} className="text-slate-300 border-b border-slate-800 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">[{log.time}]</span>
                              {log.source && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${log.source === 'Web UI' ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                  {log.source}
                                </span>
                              )}
                            </div>
                            {log.status === 200 ? <span className="text-green-400 bg-green-400/10 px-1.5 rounded">SUCCESS</span> : <span className="text-red-400 bg-red-400/10 px-1.5 rounded">ERROR</span>}
                          </div>
                          <div className="text-blue-400 truncate mb-1">Model: {log.model.split('/').pop()}</div>
                          <div className="text-slate-400">Ping: {log.latency}ms</div>
                          <div className="text-slate-300 truncate opacity-80 mt-1 pl-2 border-l-2 border-slate-700">&gt; {log.prompt}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.main>
      )}
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-50 shadow-lg px-2 pb-safe pt-2 h-16 sm:h-20">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`absolute top-0 w-12 h-1 rounded-b-full transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
          <LayoutDashboard size={22} className={`${currentView === 'dashboard' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] sm:text-xs font-semibold">Dasbor</span>
        </button>
        
        <button
          onClick={() => setCurrentView('generator')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${currentView === 'generator' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`absolute top-0 w-12 h-1 rounded-b-full transition-colors ${currentView === 'generator' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
          <FileText size={22} className={`${currentView === 'generator' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] sm:text-xs font-semibold">Konfigurasi</span>
        </button>
        
        <button
          onClick={() => setCurrentView('user_select')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${currentView === 'user_select' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`absolute top-0 w-12 h-1 rounded-b-full transition-colors ${currentView === 'user_select' ? 'bg-emerald-600' : 'bg-transparent'}`}></div>
          <Users size={22} className={`${currentView === 'user_select' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] sm:text-xs font-semibold">Pengguna</span>
        </button>
      </div>
    </div>
  );
}