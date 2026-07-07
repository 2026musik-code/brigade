const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                    onClick={() => {
                      setSelectedUser(user.name);
                      setCurrentView('dashboard');
                    }}`;

const replacement = `                    onClick={() => {
                      setSelectedUser(user.name);
                      if (user.accountId) setAccountId(user.accountId);
                      if (user.token) setApiToken(user.token);
                      setCurrentView('dashboard');
                    }}`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
