const nodemailer = require('nodemailer');
const db = require('./database');

async function getTransporter() {
    const host = await db.getSetting('smtp_host');
    const port = await db.getSetting('smtp_port');
    const user = await db.getSetting('smtp_user');
    const pass = await db.getSetting('smtp_pass');
    
    if (!host || !user || !pass) return null;
    
    return nodemailer.createTransporter({
        host,
        port: parseInt(port) || 587,
        secure: parseInt(port) === 465,
        auth: { user, pass }
    });
}

async function sendAlert(subject, body) {
    try {
        const to = await db.getSetting('alert_email');
        if (!to) return;
        
        const transporter = await getTransporter();
        if (!transporter) return;
        
        await transporter.sendMail({
            from: await db.getSetting('smtp_user'),
            to,
            subject: `🛡️ Nexus Alert: ${subject}`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #3b82f6;">🛡️ Nexus Network Monitor</h2>
                    <p>${body}</p>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Timestamp: ${new Date().toLocaleString()}</p>
                </div>
            `
        });
        
        console.log(`Email de alerta enviado a ${to}: ${subject}`);
    } catch (err) {
        console.error('Error enviando email:', err.message);
    }
}

async function testConnection(config) {
    try {
        const transporter = nodemailer.createTransporter({
            host: config.smtp_host,
            port: parseInt(config.smtp_port) || 587,
            secure: parseInt(config.smtp_port) === 465,
            auth: { user: config.smtp_user, pass: config.smtp_pass }
        });
        await transporter.verify();
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

module.exports = { sendAlert, testConnection };
