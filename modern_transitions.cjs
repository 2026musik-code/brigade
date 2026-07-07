const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The main view is currently conditionally rendered using a ternary operator:
// {currentView === 'generator' ? ( <main... ) : (currentView === 'user_select' ? <main... : <main... )}
// We can wrap each main tag with <motion.main initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>

content = content.replace(
  /<main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">/g,
  '<motion.main initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">'
);

content = content.replace(
  /<main className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-start min-h-\[70vh\] pt-2">/g,
  '<motion.main initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-start min-h-[70vh] pt-2">'
);

content = content.replace(
  /<main className="max-w-7xl mx-auto p-6">/g,
  '<motion.main initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-7xl mx-auto p-6">'
);

content = content.replace(/<\/main>/g, '</motion.main>');

fs.writeFileSync('src/App.tsx', content);
