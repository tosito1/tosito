const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');
const routerControl = require('./router_control');
const { getCurrentDevices } = require('./scanner');

let bot = null;

async function refreshBot() {
    try {
        const token = await db.getSetting('telegram_token');
        if (bot) {
            bot.stopPolling();
            bot = null;
        }
        if (token) {
            bot = new TelegramBot(token, { polling: true });
            console.log('[Telegram] Bot interactivo iniciado.');
            setupBotListeners();
        }
    } catch (err) {
        console.error('Error al refrescar bot de Telegram:', err.message);
    }
}

function setupBotListeners() {
    bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        const devices = getCurrentDevices();
        const online = devices.filter(d => d.isOnline).length;
        const unknown = devices.filter(d => d.isOnline && !d.isTrusted).length;
        
        let text = `📊 <b>Estado de Nexus</b>\n\n`;
        text += `🟢 <b>Conectados:</b> ${online} dispositivos\n`;
        text += `❓ <b>Desconocidos:</b> ${unknown}\n`;
        
        bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
    });

    bot.onText(/\/devices/, async (msg) => {
        const chatId = msg.chat.id;
        const devices = getCurrentDevices().filter(d => d.isOnline);
        if (devices.length === 0) return bot.sendMessage(chatId, 'No hay dispositivos online.');
        
        let text = `📱 <b>Dispositivos Online</b>\n\n`;
        devices.forEach(d => {
            const icon = d.os === 'Windows' ? '🪟' : d.os === 'iOS' ? '📱' : d.os === 'macOS' ? '🍏' : d.os === 'Android' ? '🤖' : '🌐';
            const name = d.customName || d.hostname || d.ip;
            const trust = d.isTrusted ? '✅' : '❓';
            text += `${icon} ${trust} <b>${name}</b> (<code>${d.ip}</code>)\n`;
        });
        
        bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
    });

    bot.on('callback_query', async (query) => {
        const data = query.data;
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;

        try {
            if (data.startsWith('trust_')) {
                const ip = data.split('_')[1];
                await db.trustDevice(ip);
                bot.answerCallbackQuery(query.id, { text: '✅ Dispositivo marcado como seguro.' });
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
                bot.sendMessage(chatId, `✅ Se ha confiado en el dispositivo <code>${ip}</code>.`, { parse_mode: 'HTML' });
            } 
            else if (data.startsWith('block_')) {
                const mac = data.split('_')[1];
                const ip = data.split('_')[2];
                await routerControl.blockMac(mac);
                await db.updateBlockStatus(ip, true);
                bot.answerCallbackQuery(query.id, { text: '🛑 Bloqueo ejecutado en el router.' });
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
                bot.sendMessage(chatId, `🛑 <b>Dispositivo Bloqueado a nivel de Red</b>\nMAC: <code>${mac}</code>\nIP: <code>${ip}</code>`, { parse_mode: 'HTML' });
            }
        } catch (err) {
            bot.answerCallbackQuery(query.id, { text: '❌ Error: ' + err.message, show_alert: true });
        }
    });
}

async function sendTelegramAlert(message, device = null) {
    try {
        const chatId = await db.getSetting('telegram_chat_id');
        if (!bot || !chatId) return;

        const opts = { parse_mode: 'HTML' };
        
        if (device && device.ip && message.includes('Nuevo')) {
            opts.reply_markup = {
                inline_keyboard: [[
                    { text: '✅ Confiar', callback_data: `trust_${device.ip}` }
                ]]
            };
            if (device.mac) {
                opts.reply_markup.inline_keyboard[0].push(
                    { text: '🛑 Bloquear', callback_data: `block_${device.mac}_${device.ip}` }
                );
            }
        }

        await bot.sendMessage(chatId, message, opts);
        console.log(`Telegram: alerta interactiva enviada a ${chatId}`);
    } catch (err) {
        console.error('Error enviando Telegram:', err.message);
    }
}

async function testTelegram(token, chatId) {
    try {
        const testBot = new TelegramBot(token, { polling: false });
        await testBot.sendMessage(chatId, `✅ <b>Nexus Network Monitor</b>\n\n🎉 Conexión interactiva con Telegram configurada.\nPrueba a enviarme /status o /devices.`, { parse_mode: 'HTML' });
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

module.exports = { sendTelegramAlert, testTelegram, refreshBot };
