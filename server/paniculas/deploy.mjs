import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log('Connecting to server 192.168.1.134...');
        await ssh.connect({
            host: '192.168.1.134',
            username: 'tosito',
            password: 'tosito13.',
            tryKeyboard: true,
            onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
                if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
                    finish(['tosito13.']);
                } else {
                    finish([]);
                }
            }
        });
        
        console.log('Connected! Uploading dist folder...');
        const localDist = path.join(__dirname, 'dist');
        const remoteDist = '/home/tosito/nexus/paniculas/dist';
        
        await ssh.putDirectory(localDist, remoteDist, {
            recursive: true,
            concurrency: 10,
        });
        
        console.log('Upload complete. Restarting PM2...');
        const result = await ssh.execCommand('pm2 restart paniculas');
        console.log('PM2 STDOUT:', result.stdout);
        console.log('PM2 STDERR:', result.stderr);
        
        console.log('Deployment successful!');
    } catch (err) {
        console.error('Deployment failed:', err);
    } finally {
        ssh.dispose();
    }
}

deploy();
