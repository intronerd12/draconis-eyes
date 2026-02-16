const http = require('http');
const fs = require('fs');
const path = require('path');

const NGROK_API_URL = 'http://127.0.0.1:4040/api/tunnels';

const getHttpsTunnelUrl = (tunnels) => {
  if (!Array.isArray(tunnels)) return null;
  const httpsTunnel = tunnels.find((t) => typeof t.public_url === 'string' && t.public_url.startsWith('https://'));
  return httpsTunnel ? httpsTunnel.public_url : null;
};

const updateApiFile = (publicUrl) => {
  const apiPath = path.join(__dirname, 'services', 'api.js');
  const source = fs.readFileSync(apiPath, 'utf8');
  const pattern = /const ngrokUrl = '.*?';/;

  if (!pattern.test(source)) {
    console.error('Could not find ngrokUrl line in services/api.js');
    process.exit(1);
  }

  const updated = source.replace(pattern, `const ngrokUrl = '${publicUrl}';`);
  fs.writeFileSync(apiPath, updated, 'utf8');
  console.log('Updated ngrokUrl to:', publicUrl);
};

http
  .get(NGROK_API_URL, (res) => {
    if (res.statusCode !== 200) {
      console.error('Failed to query ngrok API. Status code:', res.statusCode);
      res.resume();
      process.exit(1);
    }

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const publicUrl = getHttpsTunnelUrl(json.tunnels);
        if (!publicUrl) {
          console.error('No HTTPS tunnel found from ngrok API.');
          process.exit(1);
        }
        updateApiFile(publicUrl);
      } catch (e) {
        console.error('Error parsing ngrok API response:', e.message);
        process.exit(1);
      }
    });
  })
  .on('error', (err) => {
    console.error('Error contacting ngrok API:', err.message);
    process.exit(1);
  });

