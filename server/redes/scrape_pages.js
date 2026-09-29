const zte = require('./backend/zte_router.js');
const fs = require('fs');

async function scrape() {
    try {
        await zte.login();
        console.log("Session:", zte._session);

        const pages = [
            'wlan_wlanbasiconoff_t.lp',
            'firewall_macfilterv3_t.lp',
            'firewall_parentctrl_t.lp',
            'firewall_portforwarding_t.lp'
        ];

        for (const page of pages) {
            console.log("Fetching", page);
            // El F6705 usa _type=menuView&_tag=...
            const url = `/?_type=menuView&_tag=${page}&_sessionTOKEN=${zte._session.token}`;
            const res = await zte.routerGet(url);
            if (res.data) {
                fs.writeFileSync(`router_${page}.html`, res.data);
                console.log(`Saved ${page}`);
            } else {
                console.log(`Failed to get ${page}`);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
scrape();
