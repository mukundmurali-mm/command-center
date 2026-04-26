import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import vaultRoutes from './routes/vault.js';
import configRoutes from './routes/config.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/vault', vaultRoutes);
app.use('/api/config', configRoutes);

// GET /api/version
app.get('/api/version', async (req, res) => {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
        const current = pkg.version;
        
        // Fetch latest release from GitHub
        const response = await fetch('https://api.github.com/repos/mukundm/command-center/releases/latest');
        const data = await response.json();
        
        const latest = data.tag_name || current;
        const releaseUrl = data.html_url;
        
        res.json({
            current,
            latest,
            updateAvailable: current !== latest,
            releaseUrl
        });
    } catch (error) {
        res.json({ current: '1.0.0', latest: '1.0.0', updateAvailable: false });
    }
});

// Production static file serving
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // SPA catch-all
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
    console.log(`Command Center server running on port ${PORT}`);
});
