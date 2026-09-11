// Images download karne ka helper
const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'images', 'clifford');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

https.get('https://www.cliffordglassstudio.co.uk/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = new Set();
    const regex = /(?:src|url\()[\'\"]?(https?:\/\/[^\'\">]+|\/[^\'\">)]+)[\'\"]?\)?/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      let u = match[1];
      if (!u.startsWith('http')) u = 'https://www.cliffordglassstudio.co.uk' + u;
      if (u.match(/\.(jpg|jpeg|png|webp)/i)) urls.add(u);
    }
    
    let cnt = 0;
    Array.from(urls).slice(0, 15).forEach(u => {
      const name = path.basename(new URL(u).pathname);
      if (name) {
        https.get(u, (imgRes) => {
          const file = fs.createWriteStream(path.join(dir, name));
          imgRes.pipe(file);
          cnt++;
        }).on('error', () => {});
      }
    });
  });
}).on('error', err => console.error(err));
