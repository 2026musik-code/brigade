const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const sisaTokenRegex = /<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">[\s\S]*?<div className="px-5 py-4 border-b border-slate-200 bg-slate-50 font-medium text-sm flex items-center gap-2">[\s\S]*?Panel Request ke Model AI[\s\S]*?<\/div>[\s\S]*?<div className="p-5 space-y-4 flex-1 overflow-y-auto">[\s\S]*?availableModels\.slice\(0, 10\)\.map[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newPanel = `<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
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
                </div>`;

content = content.replace(sisaTokenRegex, newPanel);
fs.writeFileSync('src/App.tsx', content);

