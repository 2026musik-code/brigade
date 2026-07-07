with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("      )}\n    </div>\n      {/* Bottom Navigation Bar */}", "      )}\n      {/* Bottom Navigation Bar */}")

with open("src/App.tsx", "w") as f:
    f.write(content)
