const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix Bottom Nav to be very standard
const bottomNavRegex = /<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-end z-50 shadow-\[0_-4px_10px_-1px_rgba\(0,0,0,0\.05\)\] px-2 pb-2 pt-0 sm:pb-4 sm:pt-1\">[\s\S]*?<\/div>\n    <\/div>/;

const newBottomNav = `<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-50 shadow-lg px-2 pb-safe pt-2 h-16 sm:h-20">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={\`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors \${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}\`}
        >
          <div className={\`absolute top-0 w-12 h-1 rounded-b-full transition-colors \${currentView === 'dashboard' ? 'bg-indigo-600' : 'bg-transparent'}\`}></div>
          <LayoutDashboard size={22} className={\`\${currentView === 'dashboard' ? 'scale-110' : ''} transition-transform\`} />
          <span className="text-[10px] sm:text-xs font-semibold">Dasbor</span>
        </button>
        
        <button
          onClick={() => setCurrentView('generator')}
          className={\`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors \${currentView === 'generator' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}\`}
        >
          <div className={\`absolute top-0 w-12 h-1 rounded-b-full transition-colors \${currentView === 'generator' ? 'bg-blue-600' : 'bg-transparent'}\`}></div>
          <FileText size={22} className={\`\${currentView === 'generator' ? 'scale-110' : ''} transition-transform\`} />
          <span className="text-[10px] sm:text-xs font-semibold">Konfigurasi</span>
        </button>
        
        <button
          onClick={() => setCurrentView('user_select')}
          className={\`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors \${currentView === 'user_select' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}\`}
        >
          <div className={\`absolute top-0 w-12 h-1 rounded-b-full transition-colors \${currentView === 'user_select' ? 'bg-emerald-600' : 'bg-transparent'}\`}></div>
          <Users size={22} className={\`\${currentView === 'user_select' ? 'scale-110' : ''} transition-transform\`} />
          <span className="text-[10px] sm:text-xs font-semibold">Pengguna</span>
        </button>
      </div>
    </div>`;

content = content.replace(bottomNavRegex, newBottomNav);
fs.writeFileSync('src/App.tsx', content);

