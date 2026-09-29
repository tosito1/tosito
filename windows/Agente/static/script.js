const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const cpuBar = document.getElementById('cpu-bar');
const cpuText = document.getElementById('cpu-text');
const ramBar = document.getElementById('ram-bar');
const ramText = document.getElementById('ram-text');
const currentModeDisplay = document.getElementById('current-mode-display');

let currentMode = 'windows';

// Stats Update
async function updateStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        cpuBar.style.width = `${data.cpu_percent}%`;
        cpuText.innerText = `${data.cpu_percent}%`;
        
        ramBar.style.width = `${data.ram_percent}%`;
        ramText.innerText = `${data.ram_percent}%`;
    } catch (e) {
        console.error("Error updating stats", e);
    }
}

setInterval(updateStats, 2000);
updateStats();

// Mode Selection
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const mode = btn.dataset.mode;
        
        // UI Update
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = mode;
        currentModeDisplay.innerText = mode.toUpperCase() + ' ASSISTANT';
        
        // API Update
        await fetch('/api/mode', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({mode: mode})
        });
        
        addMessage(`Cambiado al modo ${mode.toUpperCase()}`, 'ai');
    });
});

// Chat Logic
async function sendMessage() {
    const msg = userInput.value.trim();
    if (!msg) return;
    
    addMessage(msg, 'user');
    userInput.value = '';
    
    // Typing indicator simulation
    const typingBubble = addMessage('...', 'ai', true);
    
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: msg, mode: currentMode})
        });
        const data = await res.json();
        
        typingBubble.remove();
        addMessage(data.response, 'ai');
    } catch (e) {
        if (typingBubble) typingBubble.remove();
        addMessage("Error al conectar con el servidor. Revisa si Ollama está activo.", 'ai');
    }
}

function addMessage(text, side, isTyping = false) {
    const div = document.createElement('div');
    div.className = `message ${side}-msg`;
    
    if (side === 'ai') {
        const img = document.createElement('img');
        img.src = '/static/ai_avatar_premium.png';
        img.className = 'avatar';
        div.appendChild(img);
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = text;
    
    div.appendChild(bubble);
    chatContainer.appendChild(div);
    
    // Smooth scroll
    setTimeout(() => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
    
    return div;
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
