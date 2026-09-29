let canvas = document.getElementById('board');
let ctx = canvas.getContext('2d', { willReadFrequently: true });
const laserCanvas = document.getElementById('laser-board');
const laserCtx = laserCanvas.getContext('2d', { willReadFrequently: true });
const canvasWrapper = document.getElementById('canvas-wrapper');
const zoomIndicator = document.getElementById('zoom-indicator');

let currentZoom = 1;
let panX = 0;
let panY = 0;

// Cinematic Smoothers
let smoothZoom = 1;
let smoothPanX = 0;
let smoothPanY = 0;

// Layers System
let layers = [{ id: Date.now().toString(), canvas: canvas, ctx: ctx, name: 'Capa 1' }];
let activeLayerIndex = 0;
const layersBtn = document.getElementById('layers-btn');
const layersPanel = document.getElementById('layers-panel');
const addLayerBtn = document.getElementById('add-layer-btn');
const layersList = document.getElementById('layers-list');
const resetViewBtn = document.getElementById('reset-view-btn');

// Recording System
const recordBtn = document.getElementById('record-btn');
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

// UI Elements
const colorPicker = document.getElementById('color-picker');
const sizeSlider = document.getElementById('size-slider');
const opacitySlider = document.getElementById('opacity-slider');
const brushTypeSelect = document.getElementById('brush-type');

const brushBtn = document.getElementById('brush-btn');
const eraserBtn = document.getElementById('eraser-btn');
const fillBtn = document.getElementById('fill-btn');
const textBtn = document.getElementById('text-btn');
const shapeBtn = document.getElementById('shape-btn');
const symmetryBtn = document.getElementById('symmetry-btn');
const stickyBtn = document.getElementById('sticky-btn');
const shapeOptions = document.querySelectorAll('.dropdown-content a');

const bgBtn = document.getElementById('bg-btn');
const imageUpload = document.getElementById('image-upload');
const uploadBtn = document.getElementById('upload-btn');
const toggleBgImageBtn = document.getElementById('toggle-bg-image-btn');
const bgImage = document.getElementById('bg-image');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const helpBtn = document.getElementById('help-btn');

const symmetryLine = document.getElementById('symmetry-line');
const textOverlay = document.getElementById('text-overlay');
const stickyContainer = document.getElementById('sticky-container');
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help-btn');

// Webcam AI Variables
const webcamBtn = document.getElementById('webcam-btn');
const pipContainer = document.getElementById('pip-container');
const videoElement = document.getElementById('input_video');
const outputCanvasElement = document.getElementById('output_canvas');
const outputCtx = outputCanvasElement.getContext('2d');
const pipStatus = document.getElementById('pip-status');

// State
let cameraActive = false;
let cameraInstance = null;
let handsInstance = null;
let isPinching = false;

let bgImageVisible = false;
let bgImageLoaded = false;

let isDrawing = false;
let currentTool = 'brush'; // 'brush', 'eraser', 'shape', 'fill', 'text'
let currentShape = 'line';
let brushColor = colorPicker.value;
let brushSize = sizeSlider.value;
let brushOpacity = opacitySlider.value;
let brushStyle = brushTypeSelect.value;
let bgTheme = 'dark'; 

let isSymmetryMode = false;
let startX, startY;
let snapshot;

const undoStack = [];
const redoStack = [];
let maxHistory = 30;

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resizeCanvas() {
    layers.forEach(layer => {
        let tempCanvas = null;
        // Keep image data during resize
        if (layer.canvas.width > 0) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = layer.canvas.width;
            tempCanvas.height = layer.canvas.height;
            tempCanvas.getContext('2d').drawImage(layer.canvas, 0, 0);
        }
        
        layer.canvas.width = window.innerWidth;
        layer.canvas.height = window.innerHeight;
        
        if (tempCanvas) {
            layer.ctx.drawImage(tempCanvas, 0, 0);
        }
    });
    
    laserCanvas.width = window.innerWidth;
    laserCanvas.height = window.innerHeight;
    
    const saved = localStorage.getItem('proboard_autosave');
    if (saved && layers.length === 1) {
        restoreState(saved, true);
    } else if (layers.length === 1 && !saved) {
        fillBackground();
        saveState();
    }
}

function fillBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getBgColorForEraser() {
    if (bgTheme === 'light') return '#ffffff';
    return '#1e293b'; 
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

function getPos(e) {
    let rawX, rawY;
    if(e.touches && e.touches.length > 0) {
        rawX = e.touches[0].clientX;
        rawY = e.touches[0].clientY;
    } else {
        rawX = e.clientX;
        rawY = e.clientY;
    }
    return {
        x: (rawX - smoothPanX) / smoothZoom,
        y: (rawY - smoothPanY) / smoothZoom
    };
}

// --- Drawing Logic ---
let brushX = 0;
let brushY = 0;
let lastX = 0;
let lastY = 0;
let lastMidX = 0;
let lastMidY = 0;

let currentStrokePoints = [];
let laserSnapshot = null;

function startPosition(e) {
    if (currentTool === 'text') {
        const pos = getPos(e);
        if (textOverlay.style.display === 'block') {
            commitText();
        } else {
            textOverlay.style.display = 'block';
            textOverlay.style.left = pos.x + 'px';
            textOverlay.style.top = pos.y + 'px';
            textOverlay.style.color = brushColor;
            textOverlay.style.fontSize = Math.max(16, brushSize * 4) + 'px';
            textOverlay.value = '';
            textOverlay.dataset.x = pos.x;
            textOverlay.dataset.y = pos.y;
            setTimeout(() => textOverlay.focus(), 10);
        }
        return;
    }
    
    if (currentTool === 'fill') {
        const pos = getPos(e);
        const colorArr = hexToRgbaArr(brushColor, brushOpacity);
        floodFill(Math.floor(pos.x), Math.floor(pos.y), colorArr);
        saveState();
        return;
    }

    isDrawing = true;
    const pos = getPos(e);
    startX = pos.x;
    startY = pos.y;
    brushX = pos.x;
    brushY = pos.y;
    lastX = pos.x;
    lastY = pos.y;
    lastMidX = pos.x;
    lastMidY = pos.y;
    
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    laserSnapshot = laserCtx.getImageData(0, 0, laserCanvas.width, laserCanvas.height);
    
    currentStrokePoints = [{x: brushX, y: brushY}];
    
    if (currentTool !== 'shape') {
        draw(e); 
    }
}

function endPosition(e) {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath(); 
    saveState(); 
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); 
    const pos = getPos(e);
    
    if (currentTool === 'shape') {
        ctx.putImageData(snapshot, 0, 0);
        drawShape(pos.x, pos.y);
        if (isSymmetryMode) drawShapeMirror(pos.x, pos.y);
        return;
    }

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    
    // LazyMouse Stroke Stabilization
    // This swallows physical hand jitter completely
    let pull = 0.6;
    if (smoothZoom > 2) pull = 0.4;
    if (smoothZoom > 4) pull = 0.2;
    brushX += (pos.x - brushX) * pull;
    brushY += (pos.y - brushY) * pull;
    
    const midX = (lastX + brushX) / 2;
    const midY = (lastY + brushY) / 2;
    
    if (currentTool === 'eraser' || brushStyle === 'particles' || brushStyle === 'spray' || brushStyle === 'rainbow') {
        // These brushes render incrementally (no overlap artifacts or procedural rules apply)
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (currentTool === 'eraser') {
            ctx.strokeStyle = getBgColorForEraser();
            ctx.beginPath();
            ctx.moveTo(lastMidX, lastMidY);
            ctx.quadraticCurveTo(lastX, lastY, midX, midY);
            ctx.stroke();
            if (isSymmetryMode) drawSymmetryEraser(brushX, brushY);
        } else if (brushStyle === 'rainbow') {
            const hue = (Date.now() / 10) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = brushSize * 2;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.beginPath();
            ctx.moveTo(lastMidX, lastMidY);
            ctx.quadraticCurveTo(lastX, lastY, midX, midY);
            ctx.stroke();
        } else if (brushStyle === 'particles') {
            const density = brushSize;
            for (let i = 0; i < density; i++) {
                const offsetX = (Math.random() - 0.5) * brushSize * 4;
                const offsetY = (Math.random() - 0.5) * brushSize * 4;
                const starSize = Math.random() * (brushSize / 2);
                ctx.fillStyle = brushColor;
                ctx.shadowBlur = starSize * 2;
                ctx.shadowColor = brushColor;
                ctx.beginPath();
                ctx.arc(brushX + offsetX, brushY + offsetY, starSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (brushStyle === 'spray') {
            const density = brushSize * 2;
            ctx.fillStyle = hexToRgba(brushColor, brushOpacity);
            for (let i = 0; i < density; i++) {
                const offsetX = getRandomOffset(brushSize);
                const offsetY = getRandomOffset(brushSize);
                ctx.fillRect(brushX + offsetX, brushY + offsetY, 1, 1);
                if(isSymmetryMode) ctx.fillRect((canvas.width - brushX) - offsetX, brushY + offsetY, 1, 1);
            }
        }
        return updateStrokePointers(midX, midY);
    }

    // Continuous Path Rendering (Eliminates overlap artifacts for opacity and shadows)
    currentStrokePoints.push({x: brushX, y: brushY});
    
    ctx.putImageData(snapshot, 0, 0);
    
    ctx.lineWidth = brushSize;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    if (brushStyle === 'classic') {
        ctx.strokeStyle = hexToRgba(brushColor, brushOpacity);
        drawContinuousPath(ctx, currentStrokePoints);
        if(isSymmetryMode) drawSymmetryPath(ctx, currentStrokePoints);
        
    } else if (brushStyle === 'marker') {
        ctx.lineCap = 'butt';
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = hexToRgba(brushColor, brushOpacity * 0.5);
        drawContinuousPath(ctx, currentStrokePoints);
        if(isSymmetryMode) drawSymmetryPath(ctx, currentStrokePoints);
        
    } else if (brushStyle === 'neon') {
        ctx.strokeStyle = '#ffffff'; 
        ctx.shadowBlur = brushSize * 2;
        ctx.shadowColor = hexToRgba(brushColor, 1);
        drawContinuousPath(ctx, currentStrokePoints);
        if(isSymmetryMode) drawSymmetryPath(ctx, currentStrokePoints);
        
    } else if (brushStyle === 'laser') {
        laserCtx.putImageData(laserSnapshot, 0, 0);
        laserCtx.lineWidth = brushSize;
        laserCtx.lineCap = 'round';
        laserCtx.lineJoin = 'round';
        laserCtx.strokeStyle = '#ffffff'; 
        laserCtx.shadowBlur = brushSize * 3;
        laserCtx.shadowColor = hexToRgba(brushColor, 1);
        drawContinuousPath(laserCtx, currentStrokePoints);
        if(isSymmetryMode) drawSymmetryPath(laserCtx, currentStrokePoints, true);
    }
    
    updateStrokePointers(midX, midY);
}

function drawContinuousPath(targetCtx, points) {
    if (points.length < 2) return;
    targetCtx.beginPath();
    targetCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        targetCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Draw through the last point
    targetCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    targetCtx.stroke();
}

function drawSymmetryPath(targetCtx, points, isLaser = false) {
    if (points.length < 2) return;
    const canvasWidth = isLaser ? laserCanvas.width : canvas.width;
    targetCtx.beginPath();
    targetCtx.moveTo(canvasWidth - points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        targetCtx.quadraticCurveTo(canvasWidth - points[i].x, points[i].y, canvasWidth - xc, yc);
    }
    targetCtx.lineTo(canvasWidth - points[points.length - 1].x, points[points.length - 1].y);
    targetCtx.stroke();
}

function updateStrokePointers(midX, midY) {
    lastX = brushX;
    lastY = brushY;
    lastMidX = midX;
    lastMidY = midY;
}

function getRandomOffset(radius) {
    return (Math.random() - 0.5) * radius * 2;
}

function drawShape(x, y) {
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(brushColor, brushOpacity);
    ctx.fillStyle = hexToRgba(brushColor, brushOpacity * 0.2);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    
    if (currentShape === 'line') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentShape === 'rect') {
        const w = x - startX;
        const h = y - startY;
        ctx.rect(startX, startY, w, h);
        ctx.fill();
        ctx.stroke();
    } else if (currentShape === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

// Symmetry helpers
let lastMirrorX = null;
let lastMirrorY = null;
function drawSymmetryStroke(x, y, style) {
    const mirrorX = canvas.width - x;
    if (!lastMirrorX) {
        lastMirrorX = mirrorX;
        lastMirrorY = y;
    }
    
    ctx.beginPath();
    ctx.moveTo(lastMirrorX, lastMirrorY);
    ctx.lineTo(mirrorX, y);
    ctx.stroke();
    
    lastMirrorX = mirrorX;
    lastMirrorY = y;
}
function drawSymmetryEraser(x, y) {
    const mirrorX = canvas.width - x;
    if (!lastMirrorX) {
        lastMirrorX = mirrorX;
        lastMirrorY = y;
    }
    ctx.beginPath();
    ctx.moveTo(lastMirrorX, lastMirrorY);
    ctx.lineTo(mirrorX, y);
    ctx.stroke();
    lastMirrorX = mirrorX;
    lastMirrorY = y;
}

function drawShapeMirror(x, y) {
    const mirrorStartX = canvas.width - startX;
    const mirrorX = canvas.width - x;
    
    ctx.beginPath();
    if (currentShape === 'line') {
        ctx.moveTo(mirrorStartX, startY);
        ctx.lineTo(mirrorX, y);
        ctx.stroke();
    } else if (currentShape === 'rect') {
        const w = mirrorX - mirrorStartX;
        const h = y - startY;
        ctx.rect(mirrorStartX, startY, w, h);
        ctx.fill();
        ctx.stroke();
    } else if (currentShape === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.arc(mirrorStartX, startY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

// Reset mirror point on up
canvas.addEventListener('mousedown', () => { lastMirrorX = null; lastMirrorY = null; });
canvas.addEventListener('touchstart', () => { lastMirrorX = null; lastMirrorY = null; });

// Mouse Events
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mouseout', endPosition);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', startPosition, {passive: false});
canvas.addEventListener('touchend', endPosition);
canvas.addEventListener('touchcancel', endPosition);
canvas.addEventListener('touchmove', draw, {passive: false});

// --- Text Tool Logic ---
function commitText() {
    if (textOverlay.value.trim() !== '') {
        const x = parseFloat(textOverlay.dataset.x);
        const y = parseFloat(textOverlay.dataset.y);
        ctx.font = `${Math.max(16, brushSize * 4)}px Inter`;
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = brushOpacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textOverlay.value, x, y);
        ctx.globalAlpha = 1.0;
        
        if (isSymmetryMode) {
            ctx.fillText(textOverlay.value, canvas.width - x, y);
        }
        saveState();
    }
    textOverlay.style.display = 'none';
    textOverlay.value = '';
}
textOverlay.addEventListener('blur', commitText);
textOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitText();
});

// --- Flood Fill Algorithm ---
function hexToRgbaArr(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, Math.round(alpha * 255)];
}
function matchColor(data, pos, color) {
    return data[pos] === color[0] && data[pos+1] === color[1] && data[pos+2] === color[2] && data[pos+3] === color[3];
}
function floodFill(startX, startY, fillColor) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const w = imgData.width;
    const h = imgData.height;
    const data = imgData.data;
    
    const startPos = (startY * w + startX) * 4;
    const startColor = [data[startPos], data[startPos+1], data[startPos+2], data[startPos+3]];
    
    if (startColor[0] === fillColor[0] && startColor[1] === fillColor[1] && startColor[2] === fillColor[2] && startColor[3] === fillColor[3]) return;
    
    let stack = [[startX, startY]];
    
    while (stack.length > 0) {
        let [x, y] = stack.pop();
        let currentPos = (y * w + x) * 4;
        
        while(y >= 0 && matchColor(data, currentPos, startColor)) {
            currentPos -= w * 4;
            y--;
        }
        currentPos += w * 4;
        y++;
        
        let reachLeft = false;
        let reachRight = false;
        
        while(y < h && matchColor(data, currentPos, startColor)) {
            data[currentPos] = fillColor[0];
            data[currentPos+1] = fillColor[1];
            data[currentPos+2] = fillColor[2];
            data[currentPos+3] = fillColor[3];
            
            if (x > 0) {
                if (matchColor(data, currentPos - 4, startColor)) {
                    if (!reachLeft) {
                        stack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) reachLeft = false;
            }
            
            if (x < w - 1) {
                if (matchColor(data, currentPos + 4, startColor)) {
                    if (!reachRight) {
                        stack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) reachRight = false;
            }
            currentPos += w * 4;
            y++;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}


// --- Toolbar Events ---

colorPicker.addEventListener('input', (e) => {
    brushColor = e.target.value;
    if (currentTool === 'eraser') setTool('brush');
    if (textOverlay.style.display === 'block') textOverlay.style.color = brushColor;
});
sizeSlider.addEventListener('input', (e) => { 
    brushSize = e.target.value; 
    if (textOverlay.style.display === 'block') textOverlay.style.fontSize = Math.max(16, brushSize * 4) + 'px';
});
opacitySlider.addEventListener('input', (e) => { brushOpacity = e.target.value; });
brushTypeSelect.addEventListener('change', (e) => { 
    brushStyle = e.target.value; 
    setTool('brush');
});

function setTool(tool) {
    if (currentTool === 'text' && textOverlay.style.display === 'block') commitText();
    
    currentTool = tool;
    const btns = [brushBtn, eraserBtn, shapeBtn, fillBtn, textBtn];
    btns.forEach(b => b.classList.remove('active'));
    
    if (tool === 'brush') {
        brushBtn.classList.add('active');
        canvas.style.cursor = 'crosshair';
    } else if (tool === 'eraser') {
        eraserBtn.classList.add('active');
        canvas.style.cursor = 'cell';
    } else if (tool === 'shape') {
        shapeBtn.classList.add('active');
        canvas.style.cursor = 'crosshair';
    } else if (tool === 'fill') {
        fillBtn.classList.add('active');
        canvas.style.cursor = 'copy';
    } else if (tool === 'text') {
        textBtn.classList.add('active');
        canvas.style.cursor = 'text';
    }
}

brushBtn.addEventListener('click', () => setTool('brush'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
fillBtn.addEventListener('click', () => setTool('fill'));
textBtn.addEventListener('click', () => setTool('text'));

shapeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.preventDefault();
        currentShape = e.target.closest('a').dataset.shape;
        setTool('shape');
        shapeOptions.forEach(opt => opt.classList.remove('active'));
        e.target.closest('a').classList.add('active');
        shapeBtn.innerHTML = `<i class='${e.target.closest('a').querySelector('i').className}'></i>`;
    });
});

symmetryBtn.addEventListener('click', () => {
    isSymmetryMode = !isSymmetryMode;
    if (isSymmetryMode) {
        symmetryBtn.classList.add('active');
        symmetryLine.style.display = 'block';
    } else {
        symmetryBtn.classList.remove('active');
        symmetryLine.style.display = 'none';
    }
});

// --- Sticky Notes Logic ---
stickyBtn.addEventListener('click', () => {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.style.left = (window.innerWidth / 2 - 100) + 'px';
    note.style.top = (window.innerHeight / 2 - 100) + 'px';
    
    note.innerHTML = `
        <div class="sticky-header">
            <input type="color" class="sticky-color-picker" value="#fde047">
            <button class="sticky-close"><i class='bx bx-x'></i></button>
        </div>
        <textarea class="sticky-content" placeholder="Escribe tu nota aquí..."></textarea>
    `;
    
    // Drag logic
    const header = note.querySelector('.sticky-header');
    let isDragging = false, offset = [0,0];
    let lastX = 0;
    
    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        note.classList.add('dragging');
        offset = [
            note.offsetLeft - e.clientX,
            note.offsetTop - e.clientY
        ];
        lastX = e.clientX;
        gsap.to(note, { scale: 1.05, duration: 0.2 });
    });
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            note.classList.remove('dragging');
            gsap.to(note, { scale: 1, rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
        }
    });
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const x = e.clientX + offset[0];
            const y = e.clientY + offset[1];
            
            // Calculate velocity for tilt
            const velocityX = e.clientX - lastX;
            const tilt = gsap.utils.clamp(-15, 15, velocityX * 0.5);
            
            gsap.set(note, { left: x, top: y, rotation: tilt });
            
            lastX = e.clientX;
        }
    });
    
    // Color picker
    const cp = note.querySelector('.sticky-color-picker');
    cp.addEventListener('input', (e) => {
        // Convert hex to rgba for glassmorphism
        note.style.background = hexToRgba(e.target.value, 0.95);
    });
    
    // Close
    note.querySelector('.sticky-close').addEventListener('click', () => {
        gsap.to(note, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => note.remove() });
    });
    
    stickyContainer.appendChild(note);
    if (window.animateStickySpawn) window.animateStickySpawn(note);
});

// Background Theme
bgBtn.addEventListener('click', () => {
    if (bgTheme === 'dark') {
        bgTheme = 'grid';
        document.body.className = 'bg-grid';
    } else if (bgTheme === 'grid') {
        bgTheme = 'light';
        document.body.className = 'bg-light';
    } else {
        bgTheme = 'dark';
        document.body.className = 'bg-dark';
    }
});

uploadBtn.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            bgImage.src = event.target.result;
            bgImage.style.display = 'block';
            bgImageVisible = true;
            bgImageLoaded = true;
            toggleBgImageBtn.style.display = 'flex';
            toggleBgImageBtn.innerHTML = "<i class='bx bx-show'></i>";
        };
        reader.readAsDataURL(file);
    }
});

toggleBgImageBtn.addEventListener('click', () => {
    if (!bgImageLoaded) return;
    bgImageVisible = !bgImageVisible;
    if (bgImageVisible) {
        bgImage.style.display = 'block';
        toggleBgImageBtn.innerHTML = "<i class='bx bx-show'></i>";
    } else {
        bgImage.style.display = 'none';
        toggleBgImageBtn.innerHTML = "<i class='bx bx-hide'></i>";
    }
});

clearBtn.addEventListener('click', () => {
    canvas.style.opacity = '0';
    canvas.style.transform = 'scale(0.98)';
    canvas.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        fillBackground();
        saveState();
        canvas.style.opacity = '1';
        canvas.style.transform = 'scale(1)';
    }, 300);
});

function saveState() {
    if (undoStack.length >= maxHistory) undoStack.shift();
    const dataUrl = canvas.toDataURL();
    undoStack.push(dataUrl);
    redoStack.length = 0;
    
    // Auto-save to localStorage
    try {
        localStorage.setItem('proboard_autosave', dataUrl);
    } catch(e) {
        console.warn('Storage quota exceeded');
    }
}

function restoreState(dataUrl, addToStack = false) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }
}

undoBtn.addEventListener('click', () => {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        restoreState(undoStack[undoStack.length - 1]);
    }
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);
    }
});

downloadBtn.addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    if (bgTheme === 'light') tCtx.fillStyle = '#ffffff';
    else tCtx.fillStyle = '#1e293b';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    if (bgImageLoaded && bgImageVisible) {
        const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        if (imgRatio > canvasRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
        }
        tCtx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
    }
    
    tCtx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `ProBoard_${new Date().getTime()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
});

if(copyBtn) {
    copyBtn.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        const tCtx = tempCanvas.getContext('2d');
        tempCanvas.width = window.innerWidth;
        tempCanvas.height = window.innerHeight;
        
        if (bgTheme === 'light') tCtx.fillStyle = '#ffffff';
        else tCtx.fillStyle = '#1e293b';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw background image if any
        if (bgImageLoaded && bgImageVisible) {
            const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
            const canvasRatio = tempCanvas.width / tempCanvas.height;
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
            if (imgRatio > canvasRatio) {
                drawWidth = tempCanvas.width;
                drawHeight = tempCanvas.width / imgRatio;
                offsetY = (tempCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = tempCanvas.height;
                drawWidth = tempCanvas.height * imgRatio;
                offsetX = (tempCanvas.width - drawWidth) / 2;
            }
            tCtx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
        }
        
        // Draw all layers in order
        layers.forEach(layer => {
            tCtx.globalAlpha = parseFloat(layer.canvas.style.opacity || 1);
            if(layer.canvas.style.display !== 'none') {
                tCtx.drawImage(layer.canvas, 0, 0);
            }
        });
        tCtx.globalAlpha = 1;
        
        tempCanvas.toBlob(blob => {
            navigator.clipboard.write([new ClipboardItem({'image/png': blob})])
                .then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = "<i class='bx bx-check'></i> ¡Copiado!";
                    copyBtn.style.background = "var(--accent)";
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.style.background = "";
                    }, 2000);
                });
        });
    });
}

// Master Suite: Record Video
if(recordBtn) {
    recordBtn.addEventListener('click', () => {
        if(!isRecording) {
            // Start recording
            const streamCanvas = document.createElement('canvas');
            streamCanvas.width = window.innerWidth;
            streamCanvas.height = window.innerHeight;
            const sCtx = streamCanvas.getContext('2d');
            
            // Loop to draw layers to streamCanvas
            const drawLoop = setInterval(() => {
                if (bgTheme === 'light') sCtx.fillStyle = '#ffffff';
                else sCtx.fillStyle = '#1e293b';
                sCtx.fillRect(0, 0, streamCanvas.width, streamCanvas.height);
                
                layers.forEach(layer => {
                    if(layer.canvas.style.display !== 'none') {
                        sCtx.globalAlpha = parseFloat(layer.canvas.style.opacity || 1);
                        sCtx.drawImage(layer.canvas, 0, 0);
                    }
                });
                sCtx.globalAlpha = 1;
            }, 1000 / 30); // 30 FPS
            
            const stream = streamCanvas.captureStream(30);
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                clearInterval(drawLoop);
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `ProBoard_Timelapse_${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
            };
            
            mediaRecorder.start();
            isRecording = true;
            recordBtn.classList.add('recording');
            recordBtn.innerHTML = "<i class='bx bx-stop-circle'></i> Grabando";
        } else {
            // Stop recording
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = "<i class='bx bx-video-recording'></i> Grabar";
        }
    });
}

// Master Suite: Layers Manager
function renderLayersUI() {
    layersList.innerHTML = '';
    // Reverse so top layer is at top of UI
    [...layers].reverse().forEach((layer, i) => {
        const index = layers.length - 1 - i;
        const item = document.createElement('div');
        item.className = `layer-item ${index === activeLayerIndex ? 'active' : ''}`;
        
        item.innerHTML = `
            <span>${layer.name}</span>
            <div class="layer-actions">
                <i class='bx ${layer.canvas.style.display === 'none' ? 'bx-hide' : 'bx-show'}' data-action="toggle" title="Ocultar/Mostrar"></i>
                <i class='bx bx-trash' data-action="delete" title="Borrar"></i>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.tagName === 'I') {
                if (e.target.dataset.action === 'toggle') {
                    layer.canvas.style.display = layer.canvas.style.display === 'none' ? 'block' : 'none';
                    renderLayersUI();
                } else if (e.target.dataset.action === 'delete') {
                    if (layers.length > 1) {
                        layer.canvas.remove();
                        layers.splice(index, 1);
                        if (activeLayerIndex >= layers.length) activeLayerIndex = layers.length - 1;
                        canvas = layers[activeLayerIndex].canvas;
                        ctx = layers[activeLayerIndex].ctx;
                        renderLayersUI();
                    }
                }
            } else {
                activeLayerIndex = index;
                canvas = layers[activeLayerIndex].canvas;
                ctx = layers[activeLayerIndex].ctx;
                renderLayersUI();
            }
        });
        
        layersList.appendChild(item);
    });
}

if(layersBtn && layersPanel) {
    layersBtn.addEventListener('click', () => {
        layersPanel.style.display = layersPanel.style.display === 'none' ? 'flex' : 'none';
        renderLayersUI();
    });
}

if(addLayerBtn) {
    addLayerBtn.addEventListener('click', () => {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'layer-' + Date.now();
        newCanvas.width = window.innerWidth;
        newCanvas.height = window.innerHeight;
        newCanvas.style.backgroundColor = 'transparent';
        newCanvas.style.cursor = 'none';
        newCanvas.style.display = 'block';
        newCanvas.style.position = 'absolute';
        newCanvas.style.top = '0';
        newCanvas.style.left = '0';
        newCanvas.style.zIndex = '1';
        
        // Insert before laser board
        canvasWrapper.insertBefore(newCanvas, laserCanvas);
        
        const newCtx = newCanvas.getContext('2d', { willReadFrequently: true });
        layers.push({ id: newCanvas.id, canvas: newCanvas, ctx: newCtx, name: `Capa ${layers.length + 1}` });
        activeLayerIndex = layers.length - 1;
        canvas = newCanvas;
        ctx = newCtx;
        renderLayersUI();
    });
}

// Help Modal events
if(helpBtn && helpModal && closeHelpBtn) {
    helpBtn.addEventListener('click', () => {
        if(window.openHelpModal) window.openHelpModal(helpModal);
        else { helpModal.style.display = 'flex'; helpModal.style.opacity = '1'; }
    });
    closeHelpBtn.addEventListener('click', () => {
        if(window.closeHelpModal) window.closeHelpModal(helpModal);
        else helpModal.style.display = 'none';
    });
}

// Laser Fading Loop
function fadeLaser() {
    laserCtx.globalCompositeOperation = 'destination-out';
    laserCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    laserCtx.fillRect(0, 0, laserCanvas.width, laserCanvas.height);
    laserCtx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(fadeLaser);
}
fadeLaser();

document.addEventListener('keydown', (e) => {
    // Ignore shortcuts if writing in sticky note or text overlay
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoBtn.click();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redoBtn.click();
    } else if (e.key.toLowerCase() === 'b') setTool('brush');
    else if (e.key.toLowerCase() === 'e') setTool('eraser');
    else if (e.key.toLowerCase() === 's') setTool('shape');
    else if (e.key.toLowerCase() === 'f') setTool('fill');
    else if (e.key.toLowerCase() === 't') setTool('text');
    else if (e.key.toLowerCase() === 'm') symmetryBtn.click();
    else if (e.key.toLowerCase() === 'n') stickyBtn.click();
    else if (e.key.toLowerCase() === 'h') if (helpBtn) helpBtn.click();
});

// --- AI Hand Tracking (MediaPipe) ---
let aiSmoothedX = window.innerWidth / 2;
let aiSmoothedY = window.innerHeight / 2;
let leftHandSmoothedDistance = 0;
let leftHandSmoothedX = 0;
let leftHandSmoothedY = 0;
let isLeftPinching = false;
let isRightPinching = false;
let isTwoHandManipulating = false;
let initialHandsDistance = 0;
let initialHandsCenterX = 0;
let initialHandsCenterY = 0;
let initialPinchDistance = 0;
let initialZoom = 1;
let initialPanX = 0;
let initialPanY = 0;
let isZooming = false;

function onResults(results) {
    outputCtx.save();
    outputCtx.clearRect(0, 0, outputCanvasElement.width, outputCanvasElement.height);
    outputCtx.drawImage(results.image, 0, 0, outputCanvasElement.width, outputCanvasElement.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        pipStatus.style.display = 'none';
        
        let rightHandProcessed = false;
        let leftHandProcessed = false;
        
        let rightPinchPos = { x: 0, y: 0 };
        let leftPinchPos = { x: 0, y: 0 };
        
        let rightIsPinchingNow = false;
        let leftIsPinchingNow = false;

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i].label; // 'Right' or 'Left'
            
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            
            const dx = indexTip.x - thumbTip.x;
            const dy = indexTip.y - thumbTip.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            const rawX = indexTip.x * window.innerWidth;
            const rawY = indexTip.y * window.innerHeight;
            
            if (handedness === 'Right') {
                rightHandProcessed = true;
                
                // Extremely smooth drawing cursor (swallows physical tremor)
                let smoothing = 0.2; 
                if (smoothZoom > 2.0) smoothing = 0.1;
                
                aiSmoothedX += (rawX - aiSmoothedX) * smoothing;
                aiSmoothedY += (rawY - aiSmoothedY) * smoothing;
                
                rightPinchPos = { x: aiSmoothedX, y: aiSmoothedY };
                
                const pinchStart = 0.08;
                const pinchStop = 0.13;
                rightIsPinchingNow = distance < pinchStart || (isPinching && distance < pinchStop);
                
                // Always update the visual cursor position so the user knows where their hand is
                document.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: aiSmoothedX,
                    clientY: aiSmoothedY,
                    bubbles: true
                }));
                
                // Draw skeleton (Green = Pinching, Red = Open)
                drawConnectors(outputCtx, landmarks, HAND_CONNECTIONS, {color: rightIsPinchingNow ? '#00FF00' : '#FF0000', lineWidth: 2});
                drawLandmarks(outputCtx, landmarks, {color: rightIsPinchingNow ? '#00FF00' : '#FF0000', lineWidth: 1, radius: 2});
                
            } else if (handedness === 'Left') {
                leftHandProcessed = true;
                
                // Smoothed center for left hand
                const rawCenterX = ((indexTip.x + thumbTip.x) / 2) * window.innerWidth;
                const rawCenterY = ((indexTip.y + thumbTip.y) / 2) * window.innerHeight;
                
                const panSmoothing = 0.3;
                leftHandSmoothedX += (rawCenterX - leftHandSmoothedX) * panSmoothing;
                leftHandSmoothedY += (rawCenterY - leftHandSmoothedY) * panSmoothing;
                
                leftPinchPos = { x: leftHandSmoothedX, y: leftHandSmoothedY };
                
                const lPinchStart = 0.08;
                const lPinchStop = 0.13;
                leftIsPinchingNow = distance < lPinchStart || (isLeftPinching && distance < lPinchStop) || (isTwoHandManipulating && distance < lPinchStop);
                
                // Draw skeleton (Blue = Pinching, Yellow = Open)
                drawConnectors(outputCtx, landmarks, HAND_CONNECTIONS, {color: leftIsPinchingNow ? '#00FFFF' : '#FFFF00', lineWidth: 2});
                drawLandmarks(outputCtx, landmarks, {color: leftIsPinchingNow ? '#00FFFF' : '#FFFF00', lineWidth: 1, radius: 2});
            }
        }
        
        // --- Minority Report Dual-Hand Logic ---
        
        // 1. Dual Hand Zoom & Pan
        if (leftIsPinchingNow && rightIsPinchingNow) {
            zoomIndicator.style.display = 'block';
            
            const dx = leftPinchPos.x - rightPinchPos.x;
            const dy = leftPinchPos.y - rightPinchPos.y;
            const currentHandsDistance = Math.sqrt(dx*dx + dy*dy);
            const currentHandsCenterX = (leftPinchPos.x + rightPinchPos.x) / 2;
            const currentHandsCenterY = (leftPinchPos.y + rightPinchPos.y) / 2;
            
            if (!isTwoHandManipulating) {
                isTwoHandManipulating = true;
                initialHandsDistance = currentHandsDistance;
                initialZoom = currentZoom;
                initialPanX = panX;
                initialPanY = panY;
                initialHandsCenterX = currentHandsCenterX;
                initialHandsCenterY = currentHandsCenterY;
                
                // Cancel drawing if it was happening
                if (isPinching) {
                    isPinching = false;
                    canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                }
            } else {
                // Zoom
                const zoomFactor = currentHandsDistance / initialHandsDistance;
                let newZoom = initialZoom * zoomFactor;
                currentZoom = Math.min(Math.max(newZoom, 0.5), 10);
                
                // Pan based on the center point between both hands
                const deltaX = (currentHandsCenterX - initialHandsCenterX) / initialZoom;
                const deltaY = (currentHandsCenterY - initialHandsCenterY) / initialZoom;
                panX = initialPanX + deltaX;
                panY = initialPanY + deltaY;
            }
        } else {
            if (isTwoHandManipulating) {
                isTwoHandManipulating = false;
                zoomIndicator.style.display = 'none';
                
                // Reset initial pan anchor for single hand panning so it doesn't jump
                window.initialLeftX = leftPinchPos.x;
                window.initialLeftY = leftPinchPos.y;
                initialPanX = panX;
                initialPanY = panY;
            }
            
            // 2. Left Hand Only: Single-hand Panning
            if (leftIsPinchingNow && !rightIsPinchingNow) {
                if (!isLeftPinching) {
                    isLeftPinching = true;
                    window.initialLeftX = leftPinchPos.x;
                    window.initialLeftY = leftPinchPos.y;
                    initialPanX = panX;
                    initialPanY = panY;
                } else {
                    const deltaX = (leftPinchPos.x - window.initialLeftX) / currentZoom;
                    const deltaY = (leftPinchPos.y - window.initialLeftY) / currentZoom;
                    panX = initialPanX + deltaX;
                    panY = initialPanY + deltaY;
                }
            } else {
                isLeftPinching = false;
            }
            
            // 3. Right Hand Only: Drawing
            if (rightIsPinchingNow && !leftIsPinchingNow) {
                if (!isPinching) {
                    isPinching = true;
                    canvas.dispatchEvent(new MouseEvent('mousedown', {
                        clientX: rightPinchPos.x,
                        clientY: rightPinchPos.y,
                        bubbles: true
                    }));
                } else {
                    canvas.dispatchEvent(new MouseEvent('mousemove', {
                        clientX: rightPinchPos.x,
                        clientY: rightPinchPos.y,
                        bubbles: true
                    }));
                }
            } else {
                if (isPinching) {
                    isPinching = false;
                    canvas.dispatchEvent(new MouseEvent('mouseup', {
                        clientX: rightPinchPos.x,
                        clientY: rightPinchPos.y,
                        bubbles: true
                    }));
                }
            }
        }
        
        // Cinematic Interpolation for Camera
        smoothZoom += (currentZoom - smoothZoom) * 0.15;
        smoothPanX += (panX - smoothPanX) * 0.2;
        smoothPanY += (panY - smoothPanY) * 0.2;
        
        if (Math.abs(currentZoom - smoothZoom) > 0.001 || Math.abs(panX - smoothPanX) > 0.1 || Math.abs(panY - smoothPanY) > 0.1) {
            zoomIndicator.innerText = `Zoom: ${Math.round(smoothZoom * 100)}%`;
            canvasWrapper.style.transform = `translate(${smoothPanX}px, ${smoothPanY}px) scale(${smoothZoom})`;
        }
        
        // If right hand is lost but was pinching
        if (!rightHandProcessed && isPinching) {
            isPinching = false;
            canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }
        
    } else {
        if (isPinching) {
            isPinching = false;
            canvas.dispatchEvent(new MouseEvent('mouseup', {
                clientX: aiSmoothedX,
                clientY: aiSmoothedY,
                bubbles: true
            }));
        }
        if (isZooming) {
            isZooming = false;
            zoomIndicator.style.display = 'none';
        }
    }
    outputCtx.restore();
}

// Reset View Button
if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
        currentZoom = 1;
        panX = 0;
        panY = 0;
        zoomIndicator.style.display = 'block';
        zoomIndicator.innerText = `Zoom: 100%`;
        setTimeout(() => {
            if (!isTwoHandManipulating && !isLeftPinching) zoomIndicator.style.display = 'none';
        }, 1500);
    });
}
        


webcamBtn.addEventListener('click', async () => {
    if (!cameraActive) {
        pipContainer.style.display = 'flex';
        pipStatus.style.display = 'block';
        pipStatus.innerText = 'Cargando IA...';
        webcamBtn.classList.add('active');
        cameraActive = true;
        
        if (!handsInstance) {
            handsInstance = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
            handsInstance.setOptions({ 
                maxNumHands: 2, 
                modelComplexity: 1, 
                minDetectionConfidence: 0.5, 
                minTrackingConfidence: 0.5,
                selfieMode: true 
            });
            handsInstance.onResults(onResults);
        }
        
        if (!cameraInstance) {
            cameraInstance = new Camera(videoElement, {
                onFrame: async () => await handsInstance.send({image: videoElement}),
                width: 320, height: 240
            });
        }
        pipStatus.innerText = 'Encendiendo cámara...';
        cameraInstance.start();
        
    } else {
        if (cameraInstance) cameraInstance.stop();
        pipContainer.style.display = 'none';
        webcamBtn.classList.remove('active');
        cameraActive = false;
        if (isPinching) {
            isPinching = false;
            endPosition();
        }
    }
});
