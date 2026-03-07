const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://ui-avatars.com/api/?name=TS&background=C71585&color=fff&size=1024&font-size=0.5&length=2&bold=true';
const dest = path.join(__dirname, 'screens', 'assets', 'icon.png');
const adaptiveDest = path.join(__dirname, 'screens', 'assets', 'adaptive-icon.png');

console.log('Downloading icon from:', url);
console.log('Saving to:', dest);

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
  if (response.statusCode !== 200) {
    console.error('Failed to download icon:', response.statusCode);
    return;
  }
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
        console.log('Icon download completed');
        // Copy to adaptive icon as well
        fs.copyFileSync(dest, adaptiveDest);
        console.log('Adaptive icon updated');
    });
  });
}).on('error', function(err) {
  fs.unlink(dest, () => {}); // Delete the file async. (But we don't check result)
  console.error('Error downloading icon:', err.message);
});
