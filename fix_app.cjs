const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix copy function
const originalCopy = `  const copyInstallCommand = () => {
    navigator.clipboard.writeText(getInstallCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };`;

const newCopy = `  const copyInstallCommand = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(getInstallCommand());
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = getInstallCommand();
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error('execCommand Error', error);
        } finally {
          textArea.remove();
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Gagal menyalin. Silakan salin teks secara manual.');
    }
  };`;

content = content.replace(originalCopy, newCopy);

// 2. Fix bottom bar
const bottomNavRegex = /<div className="fixed bottom-6 left-1\/2 -translate-x-1\/2 w-\[90%\] max-w-\[400px\] bg-white\/80 backdrop-blur-xl border border-white\/50 p-2 px-4 flex justify-around items-center z-50 shadow-\[0_20px_40px_rgb\(0,0,0,0\.1\)\] rounded-2xl">[\s\S]*?<\/div>\n    <\/div>/;

const newBottomNav = `<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-end z-50 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] px-2 pb-2 pt-0 sm:pb-4 sm:pt-1">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={\`flex flex-col items-center gap-1.5 p-2 w-24 sm:w-28 transition-all duration-300 relative \${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg mt-1'}\`}
        >
          {currentView === 'dashboard' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 rounded-b-full"></div>
          )}
          <LayoutDashboard size={20} className={currentView === 'dashboard' ? 'mt-1' : ''} />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dasbor</span>
        </button>
        
        <button
          onClick={() => setCurrentView('generator')}
          className={\`flex flex-col items-center gap-1.5 p-2 w-24 sm:w-28 transition-all duration-300 relative \${currentView === 'generator' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg mt-1'}\`}
        >
          {currentView === 'generator' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 rounded-b-full"></div>
          )}
          <FileText size={20} className={currentView === 'generator' ? 'mt-1' : ''} />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dokumen</span>
        </button>
        
        <button
          onClick={() => setCurrentView('user_select')}
          className={\`flex flex-col items-center gap-1.5 p-2 w-24 sm:w-28 transition-all duration-300 relative \${currentView === 'user_select' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg mt-1'}\`}
        >
          {currentView === 'user_select' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600 rounded-b-full"></div>
          )}
          <Users size={20} className={currentView === 'user_select' ? 'mt-1' : ''} />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">List User</span>
        </button>
      </div>
    </div>`;

content = content.replace(bottomNavRegex, newBottomNav);

fs.writeFileSync('src/App.tsx', content);
