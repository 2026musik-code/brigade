const fs = require('fs');

let content = fs.readFileSync('src/worker.ts', 'utf8');

const oldRun = `echo -e "\\\\e[1;32m[+] Selesai! Menjalankan antarmuka CLI...\\\\e[0m"
if command -v python3 >/dev/null; then
    python3 test_ai.py < /dev/tty
else
    python test_ai.py < /dev/tty
fi\`;`;

const newRun = `echo -e "\\\\e[1;32m[+] Selesai! Antarmuka CLI berhasil diunduh.\\\\e[0m"
echo -e "\\\\e[1;36m[*] Silakan jalankan perintah berikut untuk mulai:\\\\e[0m"
echo -e "\\\\e[1;33m    python3 test_ai.py\\\\e[0m"
\`;`;

content = content.replace(oldRun, newRun);

fs.writeFileSync('src/worker.ts', content);

