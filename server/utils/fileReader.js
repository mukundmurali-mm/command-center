import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.command-center');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Reads the configuration from the local JSON file.
 * Returns { vaults: [] } if the file doesn't exist.
 */
export function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return { vaults: [] };
        }
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading config file:', error);
        return { vaults: [] };
    }
}

/**
 * Writes the configuration to the local JSON file.
 * Creates the configuration directory if it doesn't exist.
 * @param {Object} config The configuration object to save.
 */
export function writeConfig(config) {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true }, 0o700);
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing config file:', error);
        throw error;
    }
}
