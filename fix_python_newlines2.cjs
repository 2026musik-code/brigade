const fs = require('fs');
let content = fs.readFileSync('src/worker.ts', 'utf8');

content = content.replace(
  'actual_prompt = f"[System Context: {system_instruction}]\\\\n\\\\n{prompt}"',
  'actual_prompt = f"[System Context: {system_instruction}]\\n\\n{prompt}"'
);
fs.writeFileSync('src/worker.ts', content);
