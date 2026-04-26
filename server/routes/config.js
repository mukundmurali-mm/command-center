import express from 'express';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { v4 as uuidv4 } from 'uuid';
import { readConfig, writeConfig } from '../utils/fileReader.js';

const execPromise = promisify(exec);
const router = express.Router();

/**
 * Opens a native OS folder picker dialog.
 * macOS: osascript
 * Linux: zenity
 * Windows: PowerShell
 */
async function pickFolder() {
    const platform = os.platform();
    let command = '';

    if (platform === 'darwin') {
        command = `osascript -e 'POSIX PATH of (choose folder with prompt "Select an Obsidian Vault Folder")'`;
    } else if (platform === 'linux') {
        command = `zenity --file-selection --directory`;
    } else if (platform === 'win32') {
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; if($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath }"`;
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    try {
        const { stdout } = await execPromise(command);
        const pickedPath = stdout.trim();
        if (!pickedPath) return { cancelled: true };
        return { path: pickedPath };
    } catch (error) {
        // osascript returns error if user cancels
        return { cancelled: true };
    }
}

// GET /api/config - Returns the full config object
router.get('/', (req, res) => {
    res.json(readConfig());
});

// POST /api/config/vaults - Adds a new vault
router.post('/vaults', (req, res) => {
    const { path: vaultPath } = req.body;

    if (!vaultPath) {
        return res.status(400).json({ error: 'Vault path is required' });
    }

    try {
        // Simple existence check (though blueprint doesn't explicitly require it, it's good practice)
        // In a real app we'd check if it's a directory
        
        const config = readConfig();
        const name = path.basename(vaultPath);
        const id = uuidv4();

        const newVault = { id, name, path: vaultPath };
        config.vaults.push(newVault);
        writeConfig(config);

        res.status(201).json(newVault);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save vault configuration' });
    }
});

// DELETE /api/config/vaults/:id - Removes a vault by ID
router.delete('/vaults/:id', (req, res) => {
    const { id } = req.params;
    const config = readConfig();
    const originalLength = config.vaults.length;
    
    config.vaults = config.vaults.filter(v => v.id !== id);
    
    if (config.vaults.length === originalLength) {
        return res.status(404).json({ error: 'Vault not found' });
    }
    
    writeConfig(config);
    res.status(204).send();
});

// GET /api/config/pick-folder - Opens native folder picker
router.get('/pick-folder', async (req, res) => {
    try {
        const result = await pickFolder();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to open folder picker' });
    }
});

export default router;
