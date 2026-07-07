const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { motion } from 'motion/react';",
  "import { motion } from 'motion/react';\\nimport copy from 'copy-to-clipboard';"
);

const oldCopyFn = \`  const copyInstallCommand = async () => {
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
  };\`;

const newCopyFn = \`  const copyInstallCommand = () => {
    try {
      copy(getInstallCommand());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };\`;

content = content.replace(oldCopyFn, newCopyFn);
fs.writeFileSync('src/App.tsx', content);

