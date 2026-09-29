/**
 * Hash Identifier — Identifica el tipo de hash por su formato/longitud.
 * Implementación propia sin dependencias externas.
 */

const HASH_PATTERNS = [
    // MD5 family
    { name: 'MD5',                      regex: /^[a-f0-9]{32}$/i,          mode: 0 },
    { name: 'MD5 (Unix)',               regex: /^\$1\$[./0-9A-Za-z]{0,8}\$[./0-9A-Za-z]{22}$/, mode: 500 },
    { name: 'MD5 (APR1)',               regex: /^\$apr1\$/,                 mode: 1600 },
    { name: 'md5($pass.$salt)',         regex: /^[a-f0-9]{32}:[a-f0-9]+$/i, mode: 10 },
    // SHA family
    { name: 'SHA-1',                    regex: /^[a-f0-9]{40}$/i,          mode: 100 },
    { name: 'SHA-224',                  regex: /^[a-f0-9]{56}$/i,          mode: 1300 },
    { name: 'SHA-256',                  regex: /^[a-f0-9]{64}$/i,          mode: 1400 },
    { name: 'SHA-384',                  regex: /^[a-f0-9]{96}$/i,          mode: 10800 },
    { name: 'SHA-512',                  regex: /^[a-f0-9]{128}$/i,         mode: 1700 },
    // Windows
    { name: 'NTLM',                     regex: /^[a-f0-9]{32}$/i,          mode: 1000, note: 'Igual que MD5, comprobar contexto' },
    { name: 'LM',                       regex: /^[a-f0-9]{32}$/i,          mode: 3000, note: 'Igual que MD5, comprobar' },
    { name: 'NTHash (Salted)',          regex: /^[a-f0-9]{32}:[a-f0-9]{32}$/i, mode: 1100 },
    // bcrypt
    { name: 'bcrypt',                   regex: /^\$2[aby]?\$\d{2}\$.{53}$/, mode: 3200 },
    // Unix crypt
    { name: 'sha512crypt ($6$)',        regex: /^\$6\$/,                    mode: 1800 },
    { name: 'sha256crypt ($5$)',        regex: /^\$5\$/,                    mode: 7400 },
    { name: 'md5crypt ($1$)',           regex: /^\$1\$/,                    mode: 500 },
    // Kerberos
    { name: 'Kerberos 5 TGS (RC4)',    regex: /^\$krb5tgs\$23\$/,          mode: 13100 },
    { name: 'Kerberos 5 TGS (AES128)', regex: /^\$krb5tgs\$17\$/,          mode: 19600 },
    { name: 'Kerberos 5 TGS (AES256)', regex: /^\$krb5tgs\$18\$/,          mode: 19700 },
    { name: 'Kerberos AS-REP',         regex: /^\$krb5asrep\$/,            mode: 18200 },
    // NetNTLM
    { name: 'NetNTLMv1',               regex: /^.+::.+:[a-f0-9]{48}:[a-f0-9]{32}:\d+$/i, mode: 5500 },
    { name: 'NetNTLMv2',               regex: /^.+::.+:[a-f0-9]{16}:[a-f0-9]{32}:.+$/i, mode: 5600 },
    // WPA
    { name: 'WPA-PBKDF2-PMKID',       regex: /^\*[a-f0-9]{64}\*/i,        mode: 22000 },
    // MySQL
    { name: 'MySQL4.1+',               regex: /^\*[a-f0-9]{40}$/i,         mode: 300 },
    // Misc
    { name: 'CRC32',                   regex: /^[a-f0-9]{8}$/i,            mode: 11500 },
    { name: 'Whirlpool',               regex: /^[a-f0-9]{128}$/i,          mode: 6100 },
    { name: 'RIPEMD-160',              regex: /^[a-f0-9]{40}$/i,           mode: 6000, note: 'Igual que SHA-1 en longitud' },
    { name: 'Django SHA256',           regex: /^sha256\$.+\$.+$/,           mode: 10000 },
    { name: 'Django MD5',              regex: /^md5\$.+\$.+$/,              mode: 3721 },
    { name: 'Drupal 7 ($S$)',          regex: /^\$S\$/,                     mode: 7900 },
    { name: 'phpBB3 ($H$)',            regex: /^\$H\$/,                     mode: 400 },
    { name: 'WordPress ($P$)',         regex: /^\$P\$/,                     mode: 400 },
    { name: 'Cisco-IOS (SHA256)',      regex: /^\$8\$/,                     mode: 9200 },
    { name: 'Cisco-IOS (MD5)',         regex: /^\$1\$/,                     mode: 500 },
    { name: 'Base64',                  regex: /^[A-Za-z0-9+/]+=*$/,        mode: null, note: 'Posiblemente Base64, no es un hash' },
];

/**
 * Identifica los posibles tipos de hash de un string.
 * @param {string} hash
 * @returns {Array<{name, mode, confidence, note}>}
 */
function identify(hash) {
    const trimmed = hash.trim();
    const matches = [];

    for (const pattern of HASH_PATTERNS) {
        if (pattern.regex.test(trimmed)) {
            matches.push({
                name:       pattern.name,
                mode:       pattern.mode,
                hashcatMode: pattern.mode !== null ? `-m ${pattern.mode}` : 'N/A',
                note:       pattern.note || null,
            });
        }
    }

    // Enriquecer con información de longitud
    const len = trimmed.replace(/[^a-fA-F0-9]/g, '').length;
    const lengthInfo = {
        32:  'Longitud típica de MD5 / NTLM / LM',
        40:  'Longitud típica de SHA-1 / RIPEMD-160',
        56:  'Longitud típica de SHA-224',
        64:  'Longitud típica de SHA-256',
        96:  'Longitud típica de SHA-384',
        128: 'Longitud típica de SHA-512 / Whirlpool',
    }[len];

    return {
        hash: trimmed,
        length: trimmed.length,
        hexLength: len,
        lengthInfo,
        matches: matches.length ? matches : [{ name: 'Desconocido', mode: null, note: `Longitud ${trimmed.length} caracteres` }],
    };
}

/**
 * Genera un hash de prueba para comparar formatos.
 */
function generateSample(type) {
    const samples = {
        md5:     '5f4dcc3b5aa765d61d8327deb882cf99',  // "password"
        sha1:    '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
        sha256:  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        sha512:  'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86',
        ntlm:    '8846f7eaee8fb117ad06bdd830b7586c',
        bcrypt:  '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
    };
    return samples[type] || null;
}

module.exports = { identify, generateSample, HASH_PATTERNS };
