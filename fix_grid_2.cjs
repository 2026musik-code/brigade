const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'Sisa Token per Model (Estimasi)',
  'Panel Request ke Model AI'
);

const oldGrid = '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">';
const newGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                </div>`;

content = content.replace(oldGrid, newGrid);

fs.writeFileSync('src/App.tsx', content);
