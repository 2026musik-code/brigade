const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Modernize Terminal Log
content = content.replace(
  'className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[350px]"',
  'className="bg-[#0D1117] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[350px]"'
);

content = content.replace(
  'className="px-5 py-3 border-b border-slate-800 bg-slate-950 text-slate-300 font-medium text-sm flex items-center gap-2"',
  'className="px-5 py-3 border-b border-slate-800 bg-[#161B22] text-slate-300 font-medium text-sm flex items-center gap-2"'
);

// Modernize "Simpan Profil" button specifically (sometimes generic button match misses it)
content = content.replace(
  /className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-5 py-2\.5 rounded-lg text-sm font-medium transition-colors border border-transparent shadow-sm whitespace-nowrap flex items-center justify-center"/g,
  'className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center"'
);

content = content.replace(
  /className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors"/g,
  'className="bg-slate-100 text-slate-600 p-2.5 rounded-xl hover:bg-slate-200 hover:shadow-sm transition-all duration-300"'
);

content = content.replace(
  /className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"/g,
  'className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-3.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"'
);

// Modernize stats cards
content = content.replace(
  /bg-white p-5 rounded-xl border border-white\/50 shadow-sm flex items-center gap-4/g,
  'bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300'
);

content = content.replace(
  /bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4/g,
  'bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300'
);


fs.writeFileSync('src/App.tsx', content);
