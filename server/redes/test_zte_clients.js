const zte = require('./backend/zte_router');

async function test() {
    try {
        let clients = await zte.getWifiClients();
        console.log("Clients found:", clients);
    } catch(e) {
        console.error(e);
    }
}
test();
