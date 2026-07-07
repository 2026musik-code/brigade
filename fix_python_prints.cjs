const fs = require('fs');
let content = fs.readFileSync('src/worker.ts', 'utf8');

const oldAiReplyPrint = 'print(f"\\\\033[1;32m[AI]:\\\\033[0m {msg[\'content\']}")';
const newAiReplyPrint = 'print(f"\\\\033[1;32m[AI]:\\\\033[0m\\\\n{msg[\'content\']}")\\n                    print("\\\\033[1;30m" + "-"*50 + "\\\\033[0m")';
content = content.replace(oldAiReplyPrint, newAiReplyPrint);

const oldReplyPrint = 'print(f"\\\\033[1;32m[AI]:\\\\033[0m {reply}")';
const newReplyPrint = 'print(f"\\\\033[1;32m[AI]:\\\\033[0m\\\\n{reply}")\\n                    print("\\\\033[1;30m" + "-"*50 + "\\\\033[0m")';
content = content.replace(oldReplyPrint, newReplyPrint);

fs.writeFileSync('src/worker.ts', content);
