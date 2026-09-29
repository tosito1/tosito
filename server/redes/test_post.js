const zte = require('./nexus/backend/zte_router.js');
const fs = require('fs');
async function s() {
  try {
    const pass = fs.readFileSync('./nexus/backend/password', 'utf8').trim();
    await zte.login(pass);
    
    const safeMac = 'AABBCCDDEEFF';
    const mac = 'AA:BB:CC:DD:EE:FF';
    
    console.log('Testing WITH DstMacAddr...');
    let payload = 'IF_ACTION=Apply&Name:MACFilter=Nexus_' + safeMac + '&Type=Route&select_protocol=ALL&Protocol=ALL&_InstID=-1&SrcMacAddr=' + mac + '&DstMacAddr=';
    let res = await zte.routerPost('/?_type=menuData&_tag=firewall_macfilterv3_lua.lua', payload, pass, false);
    console.log('Status 1:', res.status);
    
  } catch(e) {
    console.error('ERROR:', e);
  }
}
s();
