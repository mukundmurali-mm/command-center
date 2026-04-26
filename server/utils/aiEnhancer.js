import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const execPromise = promisify(exec);
const CACHE_DIR = path.join(os.homedir(), '.command-center');
const CACHE_FILE = path.join(CACHE_DIR, 'structure-cache.json');

let structureCache = {};

// Load cache from disk at startup
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf-8');
            structureCache = JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading AI structure cache:', error);
        structureCache = {};
    }
}

function saveCache() {
    try {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true }, 0o700);
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(structureCache, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving AI structure cache:', error);
    }
}

function findCopilotCLI() {
    const paths = [
        process.env.COPILOT_CLI_PATH,
        'copilot',
        '/opt/homebrew/bin/copilot',
        '/usr/local/bin/copilot',
        path.join(os.homedir(), '.local/bin/copilot'),
    ].filter(Boolean);

    for (const p of paths) {
        try {
            // Use which or where to verify if it's an executable on PATH if it's just 'copilot'
            if (p === 'copilot') {
                // This is a simple check; in a real app we might use 'which'
                continue; 
            }
            if (fs.existsSync(p)) return p;
        } catch (e) {}
    }
    
    // If 'copilot' was in the list, we can try running it via shell
    return 'copilot';
}

async function runCopilot(cli, prompt) {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const command = `${cli} -p "${escapedPrompt}"`;
    
    try {
        const { stdout } = await execPromise(command, { 
            timeout: 120000, 
            maxBuffer: 5 * 1024 * 1024 
        });
        return stdout;
    } catch (error) {
        console.error('Copilot CLI execution error:', error);
        throw error;
    }
}

function parseCopilotResponse(text) {
    const startMarker = '<<<WIKI_START>>>';
    const endMarker = '<<<WIKI_END>>>';
    
    const startIdx = text.indexOf(startMarker);
    const endIdx = text.indexOf(endMarker);
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = text.slice(startIdx + startMarker.length, endIdx).trim();
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse JSON between markers');
        }
    }
    
    // Fallback: find first {...} block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (e) {
            console.error('Failed to parse fallback JSON block');
        }
    }
    
    return null;
}

export async function organizeVaultStructure(filePaths) {
    if (!filePaths || filePaths.length === 0) return null;

    // Cap to 150 files to avoid token limits
    const limitedPaths = filePaths.slice(0, 150);
    
    // Generate cache key based on sorted paths
    const hash = crypto.createHash('sha256').update(limitedPaths.sort().join('\n')).digest('hex');
    
    if (structureCache[hash]) {
        return structureCache[hash].groups;
    }

    const cli = findCopilotCLI();
    const prompt = `You are organizing a personal knowledge base wiki navigation.

Given the file paths below from an Obsidian vault, analyze the file names and organize them into 3–8 logical topic groups for a wiki sidebar.

Rules:
- Group by topic/theme, not by folder structure
- Use short, clear group names (2–3 words max)
- Pick a relevant emoji icon for each group
- Every file must appear in exactly one group
- Sort files alphabetically within each group
- If a file doesn't clearly fit a topic group, put it in a "General" group

Output ONLY the following with no other text:

<<<WIKI_START>>>
{
  "groups": [
    { "name": "Group Name", "icon": "📁", "files": ["path/to/file.md"] }
  ]
}
<<<WIKI_END>>>

File paths:
${limitedPaths.join('\n')}`;

    try {
        const response = await runCopilot(cli, prompt);
        const parsed = parseCopilotResponse(response);
        
        if (parsed && parsed.groups) {
            structureCache[hash] = { groups: parsed.groups };
            saveCache();
            return parsed.groups;
        }
    } catch (error) {
        console.error('AI Organization failed:', error);
    }

    return null;
}

// Initialize cache
loadCache();
