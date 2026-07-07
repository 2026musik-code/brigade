const fs = require('fs');
let content = fs.readFileSync('src/worker.ts', 'utf8');

content = content.replace(
  '    python3 test_ai.py',
  '    python3 test_ai.py < /dev/tty'
);

content = content.replace(
  '    python test_ai.py',
  '    python test_ai.py < /dev/tty'
);

fs.writeFileSync('src/worker.ts', content);
