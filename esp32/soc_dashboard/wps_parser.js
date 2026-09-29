function parseDeepWps(hexString) {
    if (!hexString) return null;
    try {
        const buffer = Buffer.from(hexString, 'hex');
        let offset = 24; // Saltar Cabecera MAC (802.11 Management)
        
        if (buffer.length < offset + 12) return null; 
        
        offset += 12; // Saltar Parámetros Fijos (Timestamp, Interval, Capab)
        
        let wpsData = {};
        let foundWps = false;

        while (offset + 2 <= buffer.length) {
            const tagNum = buffer[offset];
            const tagLen = buffer[offset + 1];
            offset += 2;
            
            if (offset + tagLen > buffer.length) break;
            
            if (tagNum === 221 && tagLen >= 4) { // Vendor Specific
                // OUI 00:50:f2 y Type 04 (WPS)
                if (buffer[offset] === 0x00 && buffer[offset + 1] === 0x50 && buffer[offset + 2] === 0xF2 && buffer[offset + 3] === 0x04) {
                    foundWps = true;
                    let wpsOffset = offset + 4;
                    const wpsEnd = offset + tagLen;
                    
                    while (wpsOffset + 4 <= wpsEnd) {
                        const tlvType = buffer.readUInt16BE(wpsOffset);
                        const tlvLen = buffer.readUInt16BE(wpsOffset + 2);
                        wpsOffset += 4;
                        
                        if (wpsOffset + tlvLen > wpsEnd) break;
                        
                        const tlvData = buffer.subarray(wpsOffset, wpsOffset + tlvLen);
                        
                        if (tlvType === 0x1021) wpsData.manufacturer = tlvData.toString('utf8').replace(/\0/g, '');
                        if (tlvType === 0x1023) wpsData.model = tlvData.toString('utf8').replace(/\0/g, '');
                        if (tlvType === 0x1011) wpsData.device_name = tlvData.toString('utf8').replace(/\0/g, '');
                        if (tlvType === 0x104A && tlvLen === 1) wpsData.version = `WPS ${tlvData[0].toString(16).split('').join('.')}`;
                        if (tlvType === 0x1012 && tlvLen === 2) {
                            const methodId = tlvData.readUInt16BE(0);
                            if (methodId === 0x0000) wpsData.method = 'PIN';
                            else if (methodId === 0x0004) wpsData.method = 'Push Button';
                            else if (methodId === 0x0006) wpsData.method = 'Push Button (Virtual)';
                            else wpsData.method = `0x${methodId.toString(16)}`;
                        }
                        
                        wpsOffset += tlvLen;
                    }
                }
            }
            offset += tagLen;
        }
        
        return foundWps ? wpsData : null;
    } catch(e) {
        return null;
    }
}
module.exports = { parseDeepWps };
