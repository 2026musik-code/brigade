const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The bottom bar starts with "      {/* Bottom Navigation Bar */}" and ends at the end of the file.
// We need to move the first "</div>" to after the bottom bar.
// Actually, let's just replace the exact faulty string:
const faultyStr = \`      )}
    </div>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 px-6 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">\`;

const correctStr = \`      )}
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 px-6 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">\`;

content = content.replace(faultyStr, correctStr);
fs.writeFileSync('src/App.tsx', content);
