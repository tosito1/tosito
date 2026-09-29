const axios = require('axios');
const crypto = require('crypto');

function extractCookies(res) {
    const raw = res.headers['set-cookie'] || [];
    return raw.map(c => c.split(';')[0]);
}

async function login() {
    try {
        const http = axios.create({
            baseURL: 'http://192.168.1.1',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
        });

        // 1. Visit root to get initial SID and _TESTCOOKIESUPPORT
        let res1 = await http.get('/');
        let cookies = extractCookies(res1);
        console.log("Root cookies:", cookies);

        // 2. Get login token using root cookies
        let res2 = await http.get('/?_type=loginData&_tag=login_token', {
            headers: { 'Cookie': cookies.join('; ') }
        });
        let cookies2 = extractCookies(res2);
        // Merge cookies
        cookies2.forEach(c => {
            const name = c.split('=')[0];
            cookies = cookies.filter(old => !old.startsWith(name + '='));
            cookies.push(c);
        });
        console.log("Token cookies:", cookies);

        // 3. Extract token
        const match = /<ajax_response_xml_root>([^<]+)/.exec(res2.data);
        const token = match[1];
        console.log("Token:", token);

        // 4. Hash password
        const password = 'Tq8#pM!4zL$9vK_2';
        const hash = crypto.createHash('sha256').update(password + token).digest('hex');

        // 5. POST login
        const params = new URLSearchParams({
            action: 'login',
            Password: hash,
            Username: 'user'
        });

        let res3 = await http.post('/?_type=loginData&_tag=login_entry', params.toString(), {
            headers: { 
                'Cookie': cookies.join('; '),
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://192.168.1.1/'
            }
        });
        
        console.log("Login response:", res3.data);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
login();
