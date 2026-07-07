const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const originalFetch = `
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setSavedUsers(data))
        .catch(err => console.error("Failed to fetch users:", err));
`;

const newFetch = `
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSavedUsers(data);
          } else {
            console.error("Expected array from /api/users, got:", data);
            setSavedUsers([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch users:", err);
          setSavedUsers([]);
        });
`;

content = content.replace(originalFetch, newFetch);

// Also let's safeguard the rendering in case it's still undefined for some reason
content = content.replace(
  '{savedUsers.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (',
  '{(savedUsers || []).filter(user => (user?.name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? ('
);

content = content.replace(
  'savedUsers\n                .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))',
  '(savedUsers || [])\n                .filter(user => (user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()))'
);

fs.writeFileSync('src/App.tsx', content);
