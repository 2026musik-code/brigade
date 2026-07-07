const fs = require('fs');
let content = fs.readFileSync('src/worker.ts', 'utf8');

content = content.replace(
  'print(f"\\\\033[1;32m[AI]:\\\\033[0m\\\\n{msg[\'content\']}")\n                    print("\\\\033[1;30m" + "-"*50 + "\\\\033[0m")',
  'print(f"\\\\033[1;32m[AI]:\\\\033[0m\\\\n{msg[\'content\']}")\n                    print("\\\\033[1;30m" + "-"*50 + "\\\\033[0m")'
);

// Actually, in javascript literal \n is an actual newline.
// So the file currently has:
// print(f"\033[1;32m[AI]:\033[0m\n{msg['content']}")\n                    print("\033[1;30m" + "-"*50 + "\033[0m")
// Wait, no. The output of grep shows \n on the SAME line! 
// Let's replace the literal string `\n                    print` with a proper newline `\n                    print`.

content = content.replace(/\\n                    print/g, '\n                    print');

fs.writeFileSync('src/worker.ts', content);
