/**
 * OUI Lookup — identifica el fabricante de un dispositivo por su dirección MAC.
 * Usa una tabla local parcial de los fabricantes más comunes (top 200+).
 * En Ubuntu, la lista completa se puede descargar con: sudo apt install ieee-data
 */

const OUI_TABLE = {
    // Apple
    "00:03:93": "Apple", "00:05:02": "Apple", "00:0a:27": "Apple", "00:0a:95": "Apple",
    "00:11:24": "Apple", "00:14:51": "Apple", "00:16:cb": "Apple", "00:17:f2": "Apple",
    "00:19:e3": "Apple", "00:1b:63": "Apple", "00:1c:b3": "Apple", "00:1d:4f": "Apple",
    "00:1e:52": "Apple", "00:1e:c2": "Apple", "00:1f:5b": "Apple", "00:1f:f3": "Apple",
    "00:21:e9": "Apple", "00:22:41": "Apple", "00:23:12": "Apple", "00:23:32": "Apple",
    "00:23:6c": "Apple", "00:24:36": "Apple", "00:25:00": "Apple", "00:25:4b": "Apple",
    "00:25:bc": "Apple", "00:26:08": "Apple", "00:26:4a": "Apple", "00:26:b9": "Apple",
    "00:26:bb": "Apple", "00:30:65": "Apple", "00:3e:e1": "Apple", "00:50:e4": "Apple",
    "00:56:cd": "Apple", "00:61:71": "Apple", "00:6d:52": "Apple", "04:0c:ce": "Apple",
    "04:15:52": "Apple", "04:26:65": "Apple", "04:48:9a": "Apple", "04:52:f3": "Apple",
    "04:54:53": "Apple", "04:69:f8": "Apple", "04:e5:36": "Apple", "08:00:07": "Apple",
    "08:6d:41": "Apple", "0c:3e:9f": "Apple", "0c:74:c2": "Apple", "10:1c:0c": "Apple",
    "14:8f:c6": "Apple", "18:af:61": "Apple", "1c:e6:2b": "Apple", "20:78:f0": "Apple",
    "28:37:37": "Apple", "3c:07:54": "Apple", "40:33:1a": "Apple", "44:2a:60": "Apple",
    "48:d7:05": "Apple", "58:55:ca": "Apple", "5c:59:48": "Apple", "60:c5:47": "Apple",
    "68:5b:35": "Apple", "6c:40:08": "Apple", "70:48:0f": "Apple", "74:e1:b6": "Apple",
    "78:ca:39": "Apple", "7c:6d:62": "Apple", "80:00:6e": "Apple", "84:38:35": "Apple",
    "88:1f:a1": "Apple", "8c:fa:ba": "Apple", "90:72:40": "Apple", "94:bf:2d": "Apple",
    "98:d6:bb": "Apple", "9c:20:7b": "Apple", "a0:99:9b": "Apple", "a4:83:e7": "Apple",
    "a8:66:7f": "Apple", "ac:3c:0b": "Apple", "b0:65:bd": "Apple", "b4:18:d1": "Apple",
    "b8:17:c2": "Apple", "b8:78:2e": "Apple", "bc:3b:af": "Apple", "c0:63:94": "Apple",
    "c4:2c:03": "Apple", "c8:33:4b": "Apple", "cc:20:e8": "Apple", "d0:03:4b": "Apple",
    "d4:61:9d": "Apple", "d8:1d:72": "Apple", "dc:2b:61": "Apple", "e0:ac:cb": "Apple",
    "e4:25:e7": "Apple", "e8:04:0b": "Apple", "ec:35:86": "Apple", "f0:b4:79": "Apple",
    "f0:cb:a1": "Apple", "f4:f1:5a": "Apple", "f8:27:93": "Apple", "fc:25:3f": "Apple",
    // Samsung
    "00:00:f0": "Samsung", "00:02:78": "Samsung", "00:07:ab": "Samsung", "00:12:47": "Samsung",
    "00:15:99": "Samsung", "00:17:c9": "Samsung", "00:1a:8a": "Samsung", "00:1d:25": "Samsung",
    "00:21:19": "Samsung", "00:23:39": "Samsung", "00:24:54": "Samsung", "00:26:37": "Samsung",
    "08:08:c2": "Samsung", "08:d4:2b": "Samsung", "0c:71:5d": "Samsung", "10:1d:c0": "Samsung",
    "14:49:e0": "Samsung", "18:3a:2d": "Samsung", "1c:62:b8": "Samsung", "20:13:e0": "Samsung",
    "24:4b:03": "Samsung", "28:39:26": "Samsung", "2c:0e:3d": "Samsung", "34:23:ba": "Samsung",
    "38:01:97": "Samsung", "3c:5a:37": "Samsung", "40:0e:85": "Samsung", "44:4e:6d": "Samsung",
    "48:44:f7": "Samsung", "4c:3c:16": "Samsung", "50:32:37": "Samsung", "54:92:be": "Samsung",
    "58:ef:68": "Samsung", "5c:3c:27": "Samsung", "60:a1:0a": "Samsung", "64:b3:10": "Samsung",
    "68:eb:c5": "Samsung", "6c:f3:73": "Samsung", "78:1f:db": "Samsung", "78:52:1a": "Samsung",
    "7c:0b:c6": "Samsung", "80:57:19": "Samsung", "84:25:db": "Samsung", "88:32:9b": "Samsung",
    "8c:77:12": "Samsung", "90:18:7c": "Samsung", "94:35:0a": "Samsung", "98:52:b1": "Samsung",
    "9c:02:98": "Samsung", "a0:0b:ba": "Samsung", "a4:eb:d3": "Samsung", "a8:7d:12": "Samsung",
    "ac:5f:3e": "Samsung", "b0:c4:e7": "Samsung", "b4:07:f9": "Samsung", "b8:5e:7b": "Samsung",
    "bc:72:b1": "Samsung", "c0:bd:d1": "Samsung", "c4:57:6e": "Samsung", "c8:ba:94": "Samsung",
    "cc:07:ab": "Samsung", "d0:17:6a": "Samsung", "d4:88:90": "Samsung", "d8:90:e8": "Samsung",
    "dc:71:96": "Samsung", "e0:99:71": "Samsung", "e4:92:fb": "Samsung", "e8:50:8b": "Samsung",
    "ec:9b:f3": "Samsung", "f0:25:b7": "Samsung", "f4:7b:5e": "Samsung", "f8:04:2e": "Samsung",
    "fc:00:12": "Samsung",
    // Raspberry Pi Foundation
    "b8:27:eb": "Raspberry Pi", "dc:a6:32": "Raspberry Pi", "e4:5f:01": "Raspberry Pi",
    "28:cd:c1": "Raspberry Pi", "d8:3a:dd": "Raspberry Pi",
    // Xiaomi
    "00:9e:c8": "Xiaomi", "10:2a:b3": "Xiaomi", "28:6c:07": "Xiaomi", "34:80:b3": "Xiaomi",
    "38:a4:ed": "Xiaomi", "50:8f:4c": "Xiaomi", "58:44:98": "Xiaomi", "64:09:80": "Xiaomi",
    "74:23:44": "Xiaomi", "78:11:dc": "Xiaomi", "8c:be:be": "Xiaomi", "98:fa:e3": "Xiaomi",
    "a0:86:c6": "Xiaomi", "ac:c1:ee": "Xiaomi", "b0:e2:35": "Xiaomi", "d4:97:0b": "Xiaomi",
    "f4:8b:32": "Xiaomi", "f8:a2:d6": "Xiaomi", "fc:64:ba": "Xiaomi",
    // TP-Link
    "00:1d:0f": "TP-Link", "14:cc:20": "TP-Link", "18:d6:c7": "TP-Link", "1c:3b:f3": "TP-Link",
    "20:dc:e6": "TP-Link", "24:69:68": "TP-Link", "28:87:ba": "TP-Link", "2c:f0:5d": "TP-Link",
    "30:b5:c2": "TP-Link", "38:94:ed": "TP-Link", "3c:84:6a": "TP-Link", "40:16:9f": "TP-Link",
    "44:33:4c": "TP-Link", "50:c7:bf": "TP-Link", "54:a7:03": "TP-Link", "5c:89:9a": "TP-Link",
    "60:32:b1": "TP-Link", "64:70:02": "TP-Link", "6c:5a:b0": "TP-Link", "74:ea:3a": "TP-Link",
    "7c:8b:ca": "TP-Link", "80:8f:1d": "TP-Link", "84:16:f9": "TP-Link", "8c:21:0a": "TP-Link",
    "90:9a:4a": "TP-Link", "94:d9:b3": "TP-Link", "98:da:c4": "TP-Link", "a0:f3:c1": "TP-Link",
    "a4:2b:b0": "TP-Link", "b0:48:7a": "TP-Link", "b4:b0:24": "TP-Link", "c0:25:e9": "TP-Link",
    "c4:e9:84": "TP-Link", "c8:0e:14": "TP-Link", "cc:32:e5": "TP-Link", "d8:07:b6": "TP-Link",
    "dc:fe:18": "TP-Link", "e0:28:6d": "TP-Link", "e4:c3:2a": "TP-Link", "e8:de:27": "TP-Link",
    "ec:08:6b": "TP-Link", "f4:ec:38": "TP-Link", "f8:1a:67": "TP-Link",
    // Google/Nest
    "00:1a:11": "Google", "08:9e:08": "Google", "1c:f2:9a": "Google", "20:df:b9": "Google",
    "30:fd:38": "Google", "3c:5a:b4": "Google", "48:d6:d5": "Google", "54:60:09": "Google",
    "58:cb:52": "Google", "6c:ad:f8": "Google", "7c:2e:bd": "Google", "94:95:a0": "Google",
    "a4:77:33": "Google", "d4:f5:47": "Google", "f4:f5:d8": "Google", "f8:8f:ca": "Google",
    // Sony
    "00:01:4a": "Sony", "00:13:a9": "Sony", "00:1a:80": "Sony", "00:24:be": "Sony",
    "00:d9:d1": "Sony", "04:cb:88": "Sony", "10:08:b1": "Sony", "30:17:c8": "Sony",
    "40:b8:37": "Sony", "54:42:49": "Sony", "5c:51:4f": "Sony", "70:2d:d9": "Sony",
    "a0:e4:53": "Sony", "b0:7d:64": "Sony", "c8:64:c7": "Sony", "d4:61:da": "Sony",
    // Huawei
    "00:18:82": "Huawei", "00:1e:10": "Huawei", "00:25:9e": "Huawei", "04:c0:6f": "Huawei",
    "0c:37:dc": "Huawei", "10:1b:54": "Huawei", "14:b9:68": "Huawei", "1c:8e:5c": "Huawei",
    "20:2b:c1": "Huawei", "24:4c:07": "Huawei", "28:31:52": "Huawei", "2c:ab:00": "Huawei",
    "30:d1:7e": "Huawei", "34:6b:d3": "Huawei", "38:f8:89": "Huawei", "3c:47:11": "Huawei",
    "40:4d:8e": "Huawei", "44:6a:2e": "Huawei", "48:46:fb": "Huawei", "4c:1f:cc": "Huawei",
    "50:9f:27": "Huawei", "54:89:98": "Huawei", "5c:c3:07": "Huawei", "60:de:44": "Huawei",
    "68:a0:f6": "Huawei", "6c:08:dc": "Huawei", "70:7b:e8": "Huawei", "74:a7:8e": "Huawei",
    "78:f5:57": "Huawei", "7c:a2:3e": "Huawei", "80:fb:06": "Huawei", "84:a8:e4": "Huawei",
    "88:e3:ab": "Huawei", "8c:34:fd": "Huawei", "90:67:1c": "Huawei", "94:04:9c": "Huawei",
    // Cisco / Linksys
    "00:00:0c": "Cisco", "00:00:a0": "Cisco", "00:01:42": "Cisco", "00:01:63": "Cisco",
    "00:02:16": "Cisco", "00:03:6b": "Cisco", "00:04:9a": "Cisco", "00:07:0d": "Cisco",
    "00:0f:8f": "Cisco", "00:14:69": "Cisco", "00:1b:d4": "Cisco", "00:1e:be": "Cisco",
    "00:21:d7": "Cisco", "00:23:04": "Cisco", "00:24:14": "Cisco", "00:25:45": "Cisco",
    "00:26:cb": "Cisco", "00:27:0d": "Cisco", "00:e0:14": "Cisco", "00:e0:4f": "Cisco",
    // ASUS
    "00:0c:6e": "ASUS", "00:11:2f": "ASUS", "00:13:d4": "ASUS", "00:15:f2": "ASUS",
    "00:17:31": "ASUS", "00:1a:92": "ASUS", "00:1d:60": "ASUS", "00:1e:8c": "ASUS",
    "00:1f:c6": "ASUS", "00:22:15": "ASUS", "00:23:54": "ASUS", "00:24:8c": "ASUS",
    "00:26:18": "ASUS", "04:92:26": "ASUS", "08:60:6e": "ASUS", "0c:9d:92": "ASUS",
    "10:7b:44": "ASUS", "14:da:e9": "ASUS", "18:31:bf": "ASUS", "1c:87:2c": "ASUS",
    "20:cf:30": "ASUS", "2c:56:dc": "ASUS", "30:5a:3a": "ASUS", "38:2c:4a": "ASUS",
    "3c:97:0e": "ASUS", "40:16:7e": "ASUS", "44:85:00": "ASUS", "50:46:5d": "ASUS",
    "54:04:a6": "ASUS", "60:45:cb": "ASUS", "6c:62:6d": "ASUS", "74:d0:2b": "ASUS",
    "7c:10:c9": "ASUS", "80:1f:02": "ASUS", "90:e6:ba": "ASUS", "a8:5e:45": "ASUS",
    "b0:6e:bf": "ASUS", "bc:ae:c5": "ASUS", "c8:60:00": "ASUS", "d8:50:e6": "ASUS",
    "e0:3f:49": "ASUS", "f0:79:59": "ASUS", "f4:6d:04": "ASUS",
    // Intel (para PCs/laptops con WiFi Intel)
    "00:02:b3": "Intel", "00:03:47": "Intel", "00:04:23": "Intel", "00:07:e9": "Intel",
    "00:0c:f1": "Intel", "00:0e:35": "Intel", "00:0e:d8": "Intel", "00:11:11": "Intel",
    "00:12:f0": "Intel", "00:13:02": "Intel", "00:13:20": "Intel", "00:13:e8": "Intel",
    "00:15:00": "Intel", "00:16:76": "Intel", "00:18:de": "Intel", "00:19:d1": "Intel",
    "00:1b:21": "Intel", "00:1c:bf": "Intel", "00:1d:e0": "Intel", "00:1e:64": "Intel",
    "00:1e:67": "Intel", "00:1f:3b": "Intel", "00:21:5c": "Intel", "00:21:6a": "Intel",
    "00:22:fa": "Intel", "00:23:14": "Intel", "00:24:d7": "Intel", "00:27:10": "Intel",
    "34:de:1a": "Intel", "40:25:c2": "Intel", "44:85:00": "Intel", "48:51:b7": "Intel",
    "50:76:af": "Intel", "54:27:1e": "Intel", "60:67:20": "Intel", "64:80:99": "Intel",
    "68:05:ca": "Intel", "7c:5c:f8": "Intel", "80:19:34": "Intel", "84:3a:4b": "Intel",
    "88:53:2e": "Intel", "8c:8d:28": "Intel", "90:2b:34": "Intel", "94:65:9c": "Intel",
    "9c:b6:d0": "Intel", "a0:88:b4": "Intel", "a4:34:d9": "Intel", "a8:a1:59": "Intel",
    "ac:72:89": "Intel", "b0:c0:90": "Intel", "c4:d9:87": "Intel", "c8:d9:d2": "Intel",
    // Realtek (PCs)
    "00:01:6c": "Realtek", "00:e0:4c": "Realtek", "08:8f:c3": "Realtek", "10:7c:61": "Realtek",
    "44:8a:5b": "Realtek", "52:54:00": "QEMU/KVM Virtual",
    // Amazon (Echo, Fire TV)
    "00:fc:8b": "Amazon", "0c:47:c9": "Amazon", "34:d2:70": "Amazon", "38:f7:3d": "Amazon",
    "40:b4:cd": "Amazon", "44:65:0d": "Amazon", "68:37:e9": "Amazon", "74:c2:46": "Amazon",
    "78:e1:03": "Amazon", "88:71:e5": "Amazon", "a0:02:dc": "Amazon", "b4:7c:9c": "Amazon",
    "f0:27:2d": "Amazon", "fc:65:de": "Amazon",
    // Netgear
    "00:09:5b": "Netgear", "00:0f:b5": "Netgear", "00:14:6c": "Netgear", "00:18:4d": "Netgear",
    "00:1b:2f": "Netgear", "00:1e:2a": "Netgear", "00:22:3f": "Netgear", "00:26:f2": "Netgear",
    "04:a1:51": "Netgear", "08:36:c9": "Netgear", "0c:82:68": "Netgear", "10:0c:6b": "Netgear",
    "20:0c:c8": "Netgear", "28:c6:8e": "Netgear", "2c:b0:5d": "Netgear", "30:46:9a": "Netgear",
    "44:94:fc": "Netgear", "4c:60:de": "Netgear", "60:02:b4": "Netgear", "6c:b0:ce": "Netgear",
    "74:44:01": "Netgear", "84:1b:5e": "Netgear", "9c:d3:6d": "Netgear", "a0:40:a0": "Netgear",
    "b0:39:56": "Netgear", "c0:3f:0e": "Netgear", "e0:46:9a": "Netgear"
};

/**
 * Busca el fabricante en la tabla OUI para los primeros 3 octetos de una MAC.
 * @param {string} mac - Dirección MAC en formato xx:xx:xx:xx:xx:xx
 * @returns {string} Nombre del fabricante o null
 */
function lookupVendor(mac) {
    if (!mac) return null;
    const prefix = mac.toLowerCase().substring(0, 8); // ej: "b8:27:eb"
    return OUI_TABLE[prefix] || null;
}

module.exports = { lookupVendor };
