const fs = require('fs');
let content = fs.readFileSync('src/worker.ts', 'utf8');

const oldStr = `            system_instruction = (
                "Kamu adalah Asisten AI CLI (Command Line Interface) tingkat lanjut. "
                "Ikuti aturan berikut:\\\\n"
                "1. Jangan banyak bertanya. Langsung kerjakan tugas sampai akhir dan berikan hasilnya.\\\\n"
                "2. Jika terjadi error pada perintah atau kodemu, secara proaktif cari dan berikan alternatif penyelesaian.\\\\n"
                "3. Jika memang buntu (mentok) dan tidak ada jalan keluar, beritahu pengguna dengan jujur dan jelas.\\\\n"
                "4. Susun hasil, kode, dan penjelasanmu di terminal dengan sangat rapi dan terstruktur agar mudah dipahami.\\\\n"
                f"Sistem Pengguna saat ini: {sys_info}"
            )`;

const newStr = `            system_instruction = (
                "Kamu adalah Asisten AI CLI (Command Line Interface) tingkat lanjut. "
                "Ikuti aturan berikut:\\n"
                "1. Jangan banyak bertanya. Langsung kerjakan tugas sampai akhir dan berikan hasilnya.\\n"
                "2. Jika terjadi error pada perintah atau kodemu, secara proaktif cari dan berikan alternatif penyelesaian.\\n"
                "3. Jika memang buntu (mentok) dan tidak ada jalan keluar, beritahu pengguna dengan jujur dan jelas.\\n"
                "4. Susun hasil, kode, dan penjelasanmu di terminal dengan sangat rapi dan terstruktur agar mudah dipahami.\\n"
                f"Sistem Pengguna saat ini: {sys_info}"
            )`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/worker.ts', content);
