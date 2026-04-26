#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { open } from 'open';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load package version
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));

async function startServer() {
    if (!fs.existsSync(path.join(rootDir, 'dist'))) {
        console.error('Error: Application is not built. Please run "npm run build" first.');
        process.exit(1);
    }

    const server = spawn('node', [path.join(rootDir, 'server/index.js')], {
        stdio: 'inherit',
        cwd: rootDir,
        env: { ...process.env, NODE_ENV: 'production' }
    });

    setTimeout(async () => {
        await open('http://localhost:3001');
    }, 1500);

    process.on('SIGINT', () => server.kill('SIGINT'));
    process.on('SIGTERM', () => server.kill('SIGTERM'));
}

function printVersion() {
    console.log(`command-center v${pkg.version}`);
}

async function runUpdate() {
    try {
        console.log('Updating Command Center...');
        execSync('git pull --ff-only origin main', { stdio: 'inherit', cwd: rootDir });
        execSync('npm install', { stdio: 'inherit', cwd: rootDir });
        execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
        
        if (process.platform === 'darwin') {
            const plistPath = path.join(os.homedir(), 'Library/LaunchAgents/com.mukundm.command-center.plist');
            if (fs.existsSync(plistPath)) {
                execSync(`launchctl unload ${plistPath}`);
                execSync(`launchctl load ${plistPath}`);
            }
        }
        console.log('Update complete!');
    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

function manageService(action) {
    if (process.platform !== 'darwin') {
        console.error('Service management is only supported on macOS.');
        process.exit(1);
    }

    const plistPath = path.join(os.homedir(), 'Library/LaunchAgents/com.mukundm.command-center.plist');
    const nodePath = process.execPath;
    const serverPath = path.join(rootDir, 'server/index.js');
    const logPath = path.join(os.homedir(), '.command-center/server.log');

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mukundm.command-center</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${serverPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOut</key>
    <string>${logPath}</string>
    <key>StandardError</key>
    <string>${logPath}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>`;

    if (action === 'install') {
        fs.mkdirSync(path.dirname(plistPath), { recursive: true });
        fs.writeFileSync(plistPath, plistContent);
        execSync(`launchctl load ${plistPath}`);
        console.log('Background service installed and started.');
    } else if (action === 'uninstall') {
        if (fs.existsSync(plistPath)) {
            execSync(`launchctl unload ${plistPath}`);
            fs.unlinkSync(plistPath);
            console.log('Background service uninstalled.');
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        await startServer();
    } else if (args[0] === '--version' || args[0] === '-v') {
        printVersion();
    } else if (args[0] === '--update') {
        await runUpdate();
    } else if (args[0] === '--service') {
        const action = args[1];
        if (action === 'install' || action === 'uninstall') {
            manageService(action);
        } else {
            console.error('Usage: command-center --service [install|uninstall]');
            process.exit(1);
        }
    } else {
        console.error('Unknown command. Use --help for usage.');
        process.exit(1);
    }
}

main();
