const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Update global background
content = content.replace(
  '<div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">',
  '<div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-indigo-100 selection:text-indigo-900" style={{ backgroundImage: "radial-gradient(at 0% 0%, hsla(253,16%,7deg,0.03) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30deg,0.03) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30deg,0.03) 0, transparent 50%)" }}>'
);

// Update Header
content = content.replace(
  '<header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">',
  '<header className="bg-white/60 backdrop-blur-xl border-b border-white/40 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">'
);

// Update Header left logo area
content = content.replace(
  '<div className="bg-orange-500 text-white p-2 rounded-lg">',
  '<div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30">'
);
content = content.replace(
  '<h1 className="text-lg font-bold text-gray-900">AI Server</h1>',
  '<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">AI Server</h1>'
);

// Update Header right buttons
content = content.replace(
  /hover:bg-green-50 text-green-600 p-2 rounded-lg transition-colors border border-green-200 shadow-sm/g,
  'hover:bg-green-50 text-green-600 p-2.5 rounded-xl transition-all duration-300 border border-green-200 shadow-sm hover:shadow hover:scale-105'
);

// Update Cards
content = content.replace(
  /bg-white rounded-xl border border-gray-200 p-5 shadow-sm/g,
  'bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300'
);

// Update Server Dashboard card container
content = content.replace(
  /className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"/g,
  'className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 overflow-hidden flex flex-col"'
);

// Inputs (general)
content = content.replace(
  /w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500\/20 focus:border-orange-500 transition-colors/g,
  'w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner'
);

// Inputs (textarea)
content = content.replace(
  /w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500\/20 focus:border-orange-500 transition-colors min-h-\[120px\] resize-y/g,
  'w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner min-h-[120px] resize-y'
);

// Standard input borders without icons
content = content.replace(
  /px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500\/20 focus:border-orange-500/g,
  'px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner'
);
content = content.replace(
  /px-3 py-2\.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500\/20 focus:border-orange-500/g,
  'px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 shadow-inner'
);


// Replace orange colors with indigo
content = content.replace(/orange-500/g, 'indigo-500');
content = content.replace(/orange-600/g, 'indigo-600');
content = content.replace(/orange-50/g, 'indigo-50');
content = content.replace(/orange-100/g, 'indigo-100');
content = content.replace(/text-orange-400/g, 'text-indigo-400');
content = content.replace(/bg-orange-500\/20/g, 'bg-indigo-500/20');


// Primary Buttons
content = content.replace(
  /bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed px-5 py-2\.5 rounded-lg/g,
  'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-6 py-3 rounded-xl shadow-md hover:shadow-lg'
);
content = content.replace(
  /bg-gray-900 text-white hover:bg-gray-800 p-2\.5 rounded-lg/g,
  'bg-slate-900 text-white hover:bg-slate-800 p-3 rounded-xl shadow-md hover:shadow-lg'
);
content = content.replace(
  /w-full bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed py-3 px-4 rounded-lg/g,
  'w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg font-medium tracking-wide transition-all'
);

// Secondary buttons / outlines
content = content.replace(
  /px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg/g,
  'px-5 py-2.5 border border-slate-200 text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-slate-50 rounded-xl shadow-sm hover:shadow transition-all duration-300'
);

content = content.replace(
  /bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg/g,
  'bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl shadow-sm transition-all duration-300'
);


// Bottom navigation bar update
const bottomNavRegex = /<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 px-6 flex justify-around items-center z-50 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.05\)\]">/g;
content = content.replace(bottomNavRegex, '<div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white/80 backdrop-blur-xl border border-white/50 p-2 px-4 flex justify-around items-center z-50 shadow-[0_20px_40px_rgb(0,0,0,0.1)] rounded-2xl">');

// Dashboard button inside bottom nav
content = content.replace(
  /className=\{`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors \$\{currentView === 'dashboard' \? 'text-blue-600' : 'text-gray-500 hover:bg-gray-50'\}`\}/g,
  'className={`flex flex-col items-center gap-1 p-2.5 w-16 rounded-xl transition-all duration-300 ${currentView === \'dashboard\' ? \'bg-indigo-50 text-indigo-600 scale-105 shadow-sm\' : \'text-slate-400 hover:text-slate-600 hover:bg-slate-50\'}`}'
);

content = content.replace(
  /className=\{`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors \$\{currentView === 'generator' \? 'text-indigo-600' : 'text-gray-500 hover:bg-gray-50'\}`\}/g,
  'className={`flex flex-col items-center gap-1 p-2.5 w-20 rounded-xl transition-all duration-300 ${currentView === \'generator\' ? \'bg-indigo-50 text-indigo-600 scale-105 shadow-sm\' : \'text-slate-400 hover:text-slate-600 hover:bg-slate-50\'}`}'
);

content = content.replace(
  /className=\{`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors \$\{currentView === 'user_select' \? 'text-purple-600' : 'text-gray-500 hover:bg-gray-50'\}`\}/g,
  'className={`flex flex-col items-center gap-1 p-2.5 w-20 rounded-xl transition-all duration-300 ${currentView === \'user_select\' ? \'bg-purple-50 text-purple-600 scale-105 shadow-sm\' : \'text-slate-400 hover:text-slate-600 hover:bg-slate-50\'}`}'
);

// Minor tweaks
content = content.replace(/gray-/g, 'slate-'); // change gray to slate everywhere for a cooler tone.

// User search bar
content = content.replace(
  /bg-white\/60 backdrop-blur-md border border-slate-200\/80 rounded-2xl text-base/g,
  'bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl text-base shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
);


fs.writeFileSync('src/App.tsx', content);
