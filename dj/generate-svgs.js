import fs from 'fs';

function roundedRect(x, y, w, h, r) {
    return `M ${x + r},${y} ` +
           `L ${x + w - r},${y} A ${r},${r} 0 0,1 ${x + w},${y + r} ` +
           `L ${x + w},${y + h - r} A ${r},${r} 0 0,1 ${x + w - r},${y + h} ` +
           `L ${x + r},${y + h} A ${r},${r} 0 0,1 ${x},${y + h - r} ` +
           `L ${x},${y + r} A ${r},${r} 0 0,1 ${x + r},${y} Z`;
}

function rect(x, y, w, h) {
    return `M ${x},${y} L ${x+w},${y} L ${x+w},${y+h} L ${x},${y+h} Z`;
}

// Clockwise outer ring, counter-clockwise inner ring
function ring(cx, cy, ro, ri) {
    return `M ${cx-ro},${cy} A ${ro},${ro} 0 1,1 ${cx+ro},${cy} A ${ro},${ro} 0 1,1 ${cx-ro},${cy} Z ` +
           `M ${cx-ri},${cy} A ${ri},${ri} 0 1,0 ${cx+ri},${cy} A ${ri},${ri} 0 1,0 ${cx-ri},${cy} Z`;
}

function circle(cx, cy, r) {
    return `M ${cx-r},${cy} A ${r},${r} 0 1,1 ${cx+r},${cy} A ${r},${r} 0 1,1 ${cx-r},${cy} Z`;
}

// Draw a play button with an inner triangle cutout
function playButton(cx, cy, r) {
    let d = circle(cx, cy, r);
    // inner triangle (counter-clockwise to cut out)
    let size = r * 0.4;
    d += ` M ${cx - size * 0.5},${cy + size} L ${cx + size},${cy} L ${cx - size * 0.5},${cy - size} Z`;
    return d;
}

// Draw a cue button with an inner square cutout
function cueButton(cx, cy, r) {
    let d = circle(cx, cy, r);
    let size = r * 0.4;
    // inner square (counter-clockwise)
    d += ` M ${cx - size},${cy - size} L ${cx - size},${cy + size} L ${cx + size},${cy + size} L ${cx + size},${cy - size} Z`;
    return d;
}

function fader(x, y, w, h, capY, capH) {
    return roundedRect(x, y, w, capY - y, 2) + " " + roundedRect(x, capY + capH, w, (y + h) - (capY + capH), 2);
}

function deck(cx, cy, isAZ) {
    let d = "";
    // Jog Wheel
    d += " " + ring(cx, cy, isAZ ? 110 : 80, isAZ ? 95 : 72);
    // Inner Display or Cap
    if(isAZ) {
        d += " " + ring(cx, cy, 45, 42); // outer rim of display
        d += " " + circle(cx, cy, 38); // solid display area
    } else {
        d += " " + ring(cx, cy, 12, 8);
    }
    
    // Play/Cue
    let btnY = cy + (isAZ ? 160 : 130);
    d += " " + playButton(cx - 150, btnY + 50, isAZ ? 22 : 18); // Play
    d += " " + cueButton(cx - 150, btnY, isAZ ? 22 : 18); // Cue

    // Pads
    let padStartX = cx - 100;
    let padY = cy + (isAZ ? 130 : 110);
    let padSize = isAZ ? 32 : 28;
    let padGap = 6;
    for(let r=0; r<2; r++) {
        for(let c=0; c<4; c++) {
            d += " " + roundedRect(padStartX + c*(padSize+padGap), padY + r*(padSize+padGap), padSize, padSize, 4);
        }
    }

    // Pitch Fader
    let pitchX = cx + (isAZ ? 130 : 110);
    let pitchY = cy - (isAZ ? 80 : 50);
    let pitchH = isAZ ? 160 : 120;
    d += " " + fader(pitchX, pitchY, 8, pitchH, pitchY + pitchH * (Math.random()*0.6 + 0.2), 20);

    // Loop/Beat buttons (Top)
    d += " " + circle(cx - 130, cy - 100, 12);
    d += " " + circle(cx - 90, cy - 100, 12);

    return d;
}

function mixerChannel(cx, isAZ) {
    let d = "";
    // Trim
    d += " " + ring(cx, 160, 12, 8);
    // EQ High, Mid, Low
    d += " " + ring(cx, 210, 10, 6);
    d += " " + ring(cx, 250, 10, 6);
    d += " " + ring(cx, 290, 10, 6);
    // Color FX (slightly bigger)
    d += " " + ring(cx, 350, 14, 10);
    // Cue Button
    d += " " + roundedRect(cx - 10, 390, 20, 12, 3);
    // Fader
    d += " " + fader(cx - 4, 420, 8, 90, 420 + Math.random()*50, 18);
    return d;
}

let az = "";
// Main Chassis (rounded corners)
az += roundedRect(10, 10, 1280, 680, 20);
// Top Screen bezel
az += " " + roundedRect(450, 30, 400, 110, 10);
az += " " + roundedRect(460, 40, 380, 90, 5); // inner screen cutout

// Decks
az += deck(260, 350, true);
az += deck(1040, 350, true);

// 4-Channel Mixer
const azCh = [545, 615, 685, 755];
azCh.forEach(cx => az += mixerChannel(cx, true));

// Crossfader
az += " " + fader(580, 560, 140, 12, 630, 24);

// Beat FX Section (Right of mixer)
az += " " + roundedRect(840, 160, 60, 180, 6); // Screen/Select area
az += " " + ring(870, 380, 16, 12); // Big Level/Depth knob
az += " " + playButton(870, 450, 18); // ON/OFF button

fs.writeFileSync('xdj-az-detailed.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1300 700"><path fill="black" fill-rule="evenodd" d="${az}"/></svg>`);


let flx4 = "";
// Main Chassis
flx4 += roundedRect(10, 10, 980, 580, 25);

// Decks
flx4 += deck(220, 300, false);
flx4 += deck(780, 300, false);

// 2-Channel Mixer
const flx4Ch = [440, 560];
flx4Ch.forEach(cx => flx4 += mixerChannel(cx, false));

// Crossfader
flx4 += " " + fader(430, 530, 140, 10, 480, 20);

// Browse Knob
flx4 += " " + ring(500, 100, 20, 15);
flx4 += " " + roundedRect(460, 140, 30, 15, 4); // Load L
flx4 += " " + roundedRect(510, 140, 30, 15, 4); // Load R

fs.writeFileSync('flx4-detailed.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1000 600"><path fill="black" fill-rule="evenodd" d="${flx4}"/></svg>`);

console.log("SVGs generated.");
