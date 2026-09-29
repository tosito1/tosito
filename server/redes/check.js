const zte = require('./backend/zte_router');

async function check() {
    try {
        let res = await fetch('http://192.168.1.1');
        let t = await res.text();
        const m1 = t.match(/value="([^"]*)"[^>]*id="Frm_Username"/i); 
        console.log('Default username:', m1 ? m1[1] : 'not found'); 
        const m2 = t.match(/_sessionTOKEN.*value="([^"]+)"/i);
        console.log("Session token extracted from HTML:", m2 ? m2[1] : "not found");
    } catch(e) {
        console.log(e);
    }
}
check();
