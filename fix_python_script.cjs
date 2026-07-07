const fs = require('fs');

let content = fs.readFileSync('src/worker.ts', 'utf8');

// Fix the response parsing in pythonScript
const oldParse = `                if 'result' in res_data and 'response' in res_data['result']:
                    reply = res_data['result']['response']
                    self.history.append({"role": "assistant", "content": reply})
                    return reply
                return str(res_data)`;

const newParse = `                if 'result' in res_data:
                    if 'response' in res_data['result']:
                        reply = res_data['result']['response']
                    elif 'choices' in res_data['result'] and len(res_data['result']['choices']) > 0:
                        reply = res_data['result']['choices'][0]['message']['content']
                    else:
                        return str(res_data)
                    self.history.append({"role": "assistant", "content": reply})
                    return reply
                elif 'choices' in res_data and len(res_data['choices']) > 0:
                    reply = res_data['choices'][0]['message']['content']
                    self.history.append({"role": "assistant", "content": reply})
                    return reply
                return str(res_data)`;

content = content.replace(oldParse, newParse);

// Update system prompt to instruct the AI better
const oldSysPrompt = 'actual_prompt = f"[System Context: You are a CLI AI Assistant. User System: {sys_info}]\\n\\n{prompt}"';
const newSysPrompt = 'actual_prompt = f"[System Context: You are a highly advanced CLI AI Assistant. You have deep capabilities including analyzing systems, generating commands to check RAM, analyzing URLs, and executing advanced technical tasks. User System Info: {sys_info}]\\n\\n{prompt}"';
content = content.replace(oldSysPrompt, newSysPrompt);


// Add horizontal lines for AI replies
const oldAiReplyPrint = 'print(f"\\033[1;32m[AI]:\\033[0m {msg[\'content\']}")';
const newAiReplyPrint = 'print(f"\\033[1;32m[AI]:\\033[0m\\n{msg[\'content\']}")\\n                    print("\\033[1;30m" + "-"*50 + "\\033[0m")';
content = content.replace(oldAiReplyPrint, newAiReplyPrint);

// And when receiving new reply
const oldReplyPrint = 'print(f"\\033[1;32m[AI]:\\033[0m {reply}")';
const newReplyPrint = 'print(f"\\033[1;32m[AI]:\\033[0m\\n{reply}")\\n                    print("\\033[1;30m" + "-"*50 + "\\033[0m")';
content = content.replace(oldReplyPrint, newReplyPrint);

fs.writeFileSync('src/worker.ts', content);
