import React, { useState } from 'react';
import { Play, Copy, Terminal, Server, Key, Brain, FileCode2, Check, ExternalLink, User, Activity, TerminalSquare, X, CloudFog, Search } from 'lucide-react';
import { motion } from 'motion/react';

const MODELS = [
  // Llama Series
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/meta/llama-3-8b-instruct",
  "@cf/meta/llama-2-7b-chat-int8",
  "@cf/meta/llama-2-7b-chat-fp16",
  "@hf/thebloke/llama-2-13b-chat-awq",
  // Mistral & Hermes
  "@cf/mistral/mistral-7b-instruct-v0.1",
  "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
  "@hf/thebloke/openhermes-2.5-mistral-7b-awq",
  // Qwen
  "@cf/qwen/qwen1.5-14b-chat-awq",
  "@cf/qwen/qwen1.5-7b-chat-awq",
  "@cf/qwen/qwen1.5-1.8b-chat",
  // DeepSeek
  "@cf/deepseek-ai/deepseek-math-7b-instruct",
  "@cf/deepseek-ai/deepseek-coder-6.7b-instruct",
  "@cf/deepseek-ai/deepseek-coder-6.7b-base",
  // Google
  "@cf/google/gemma-7b-it",
  "@cf/google/gemma-2b-it-lora",
  // Others
  "@cf/microsoft/phi-2",
  "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
  "@hf/thebloke/zephyr-7b-beta-awq",
  "@hf/thebloke/neural-chat-7b-v3-1-awq"
];

export default function App() {
  const [accountId, setAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [prompt, setPrompt] = useState("Sapa saya dalam satu kalimat bahasa Indonesia.");
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);

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
        .then(data => setSavedUsers(data))
        .catch(err => console.error("Failed to fetch users:", err));
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

  // Reset generated link state when config changes
  React.useEffect(() => {
    setIsLinkGenerated(false);
  }, [accountId, apiToken, model]);

  const getInstallCommand = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `curl -sL "${origin}/api/install?accountId=${accountId}&token=${apiToken}&model=${encodeURIComponent(model)}" | bash`;
  };

  const copyInstallCommand = () => {
    navigator.clipboard.writeText(getInstallCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white p-2 rounded-lg">
            <Terminal size={20} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl tracking-tight">CFAI</h1>
            {currentView === 'user_select' && (
              <>
                <span className="text-gray-300 hidden sm:block">/</span>
                <span className="font-semibold text-lg tracking-tight text-gray-900 hidden sm:block">DASBOR USER</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 hidden md:flex items-center gap-2 mr-4">
            <span>Python + REST API</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setCurrentView(currentView === 'generator' ? 'user_select' : 'generator')}
              className={`flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors border ${currentView !== 'generator' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200'} shadow-sm`}
            >
              <div className={`p-1 rounded-md ${currentView !== 'generator' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                <CloudFog size={16} />
              </div>
              <div className="text-sm font-medium text-gray-700 hidden sm:block">Server Menu</div>
            </button>
          </div>
        </div>
      </header>

      {currentView === 'generator' ? (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kontrol Kiri */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Server size={16} className="text-gray-400" />
              Konfigurasi API
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                  <Server size={16} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                  <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Profil (Opsional untuk simpan ke KV)</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                  <input 
                    type="text"
                    placeholder="Contoh: Budi Cloudflare"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="flex-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                  <button
                    onClick={handleSaveUser}
                    disabled={isSavingUser || !newUserName || !accountId || !apiToken}
                    className="bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-transparent shadow-sm whitespace-nowrap flex items-center justify-center"
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Brain size={16} className="text-gray-400" />
              Parameter Model
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model AI</label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                >
                  {MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              <button 
                onClick={handleTestAPI}
                disabled={isTesting || !accountId || !apiToken || !prompt}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
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
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col"
            >
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className={`w-2 h-2 rounded-full ${testResult.success !== false && !testResult.error ? 'bg-green-500' : 'bg-red-500'}`} />
                  Hasil Pengujian API
                </div>
              </div>
              <div className="p-4 bg-gray-900 text-gray-300 font-mono text-sm overflow-x-auto max-h-[250px] overflow-y-auto">
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            </motion.div>
          )}

          {/* Code Viewer / Terminal Config */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col border border-gray-800">
            <div className="flex border-b border-gray-800 bg-gray-950">
              <div className="px-4 py-3 text-sm font-medium flex items-center gap-2 text-white border-b-2 border-orange-500 bg-gray-900/50">
                <Terminal size={16} />
                Instalasi Terminal (VPS/Termux)
              </div>
            </div>

            <div className="flex-1 flex flex-col p-6 items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
                <Terminal size={32} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Instalasi Otomatis</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                Jalankan perintah di bawah ini pada terminal VPS (Linux) atau Termux (Android) Anda. Skrip ini akan secara otomatis mengunduh, mengkonfigurasi file Python, serta menginstal dependensi yang dibutuhkan (Python3, pip, requests).
              </p>
              
              {!isLinkGenerated ? (
                  <button
                    onClick={() => setIsLinkGenerated(true)}
                    disabled={!accountId || !apiToken}
                    className="mx-auto bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-3 px-6 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                  >
                    <ExternalLink size={18} />
                    Hasilkan Link Instalasi
                  </button>
                ) : (
                  <div className="w-full max-w-2xl bg-black rounded-lg p-4 flex flex-col gap-3 text-left border border-gray-800">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
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
                      className="mt-2 ml-auto text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-gray-700"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      {copied ? 'Tersalin ke Clipboard' : 'Salin Perintah'}
                    </button>
                  </div>
                )}
            </div>
          </div>
          
        </div>
      </main>
      ) : currentView === 'user_select' ? (
        <main className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-start min-h-[70vh] pt-2">
          
          {/* Search Bar */}
          <div className="w-full max-w-2xl mb-6 mt-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari server user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-gray-200/80 rounded-2xl text-base font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-12 w-full max-w-4xl justify-items-center">
            {savedUsers.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="text-gray-500 italic col-span-2 text-center">
                {searchQuery ? 'Pengguna tidak ditemukan.' : 'Belum ada pengguna yang disimpan.'}
              </div>
            ) : (
              savedUsers
                .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((user, idx) => {
                // Different color gradients based on index
                const gradients = [
                  "from-blue-500 to-indigo-600",
                  "from-purple-500 to-pink-600",
                  "from-emerald-500 to-teal-600",
                  "from-orange-500 to-red-600"
                ];
                const glowColors = [
                  "group-hover:shadow-blue-500/30",
                  "group-hover:shadow-purple-500/30",
                  "group-hover:shadow-emerald-500/30",
                  "group-hover:shadow-orange-500/30"
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
                        <span className="text-base sm:text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 transition-all text-center px-1 leading-tight">{user.name}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-400 max-w-full truncate text-center mt-1 sm:mt-2 px-2" title={user.accountId}>{user.accountId}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </main>
      ) : (
      <main className="max-w-7xl mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white p-2 rounded-lg">
                <CloudFog size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Server Dashboard</h2>
                <p className="text-xs text-gray-500">Status & Analitik Penggunaan</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('user_select')}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Stats Cards */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Trafik Request</p>
                    <p className="text-2xl font-bold text-gray-900">{trafficCount}</p>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Ping API Cloudflare</p>
                    <p className="text-2xl font-bold text-gray-900">{pingLatency} ms</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Pengguna Aktif</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedUser}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sisa Token */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 font-medium text-sm flex items-center gap-2">
                    <Brain size={16} className="text-gray-500" />
                    Sisa Token per Model (Estimasi)
                  </div>
                  <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                    {MODELS.map(m => (
                      <div key={m}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700 truncate max-w-[200px]" title={m}>{m.split('/').pop()}</span>
                          <span className="text-gray-500">Aktif / Tersedia</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terminal Log */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col h-[350px]">
                  <div className="px-5 py-3 border-b border-gray-800 bg-gray-950 text-gray-300 font-medium text-sm flex items-center gap-2">
                    <TerminalSquare size={16} className="text-gray-500" />
                    Terminal Log Permintaan
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-3">
                    {requestLogs.length === 0 ? (
                      <div className="text-gray-500 italic">Belum ada riwayat permintaan...</div>
                    ) : (
                      requestLogs.map((log, i) => (
                        <div key={i} className="text-gray-300 border-b border-gray-800 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">[{log.time}]</span>
                              {log.source && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${log.source === 'Web UI' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                  {log.source}
                                </span>
                              )}
                            </div>
                            {log.status === 200 ? <span className="text-green-400 bg-green-400/10 px-1.5 rounded">SUCCESS</span> : <span className="text-red-400 bg-red-400/10 px-1.5 rounded">ERROR</span>}
                          </div>
                          <div className="text-blue-400 truncate mb-1">Model: {log.model.split('/').pop()}</div>
                          <div className="text-gray-400">Ping: {log.latency}ms</div>
                          <div className="text-gray-300 truncate opacity-80 mt-1 pl-2 border-l-2 border-gray-700">&gt; {log.prompt}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      )}
    </div>
  );
}

