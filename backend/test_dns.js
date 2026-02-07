const dns = require('dns');

console.log('Resolving db.gmbyjvwscgpqwbgqgqwk.supabase.co...');
dns.resolve('db.gmbyjvwscgpqwbgqgqwk.supabase.co', (err, addresses) => {
  if (err) {
    console.error('Resolve A (IPv4) failed:', err.message);
  } else {
    console.log('IPv4 Addresses:', addresses);
  }
});

dns.resolve6('db.gmbyjvwscgpqwbgqgqwk.supabase.co', (err, addresses) => {
  if (err) {
    console.error('Resolve AAAA (IPv6) failed:', err.message);
  } else {
    console.log('IPv6 Addresses:', addresses);
  }
});
