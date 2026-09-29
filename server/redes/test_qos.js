const zte = require('./nexus/backend/zte_router.js');
const fs = require('fs');
async function s() {
  try {
    const pass = fs.readFileSync('./nexus/backend/password', 'utf8').trim();
    await zte.login(pass);
    console.log('Testing QoS...');
    let res = await zte.setQoS('AA:BB:CC:DD:EE:FF', 10, 5, pass);
    console.log('QoS Result:', res);
    console.log('Testing Port Forwarding Fetch...');
    let rules = await zte.getPortForwarding(pass);
    console.log('Rules:', rules);
  } catch(e) {
    console.error('ERROR:', e);
  }
}
s();
