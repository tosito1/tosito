const zte = require('./backend/zte_router');

async function run() {
    try {
        console.log("Intentando login...");
        const result = await zte.login();
        console.log("Resultado del login:", result);
        const clients = await zte.getWifiClients();
        console.log("Clientes:", clients);
    } catch (e) {
        console.error("Error en login:", e);
    }
}
run();
