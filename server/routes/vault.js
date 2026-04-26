import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { organizeVaultStructure } from '../utils/aiEnhancer.js';

const router = express.Router();

/**
 * Recursively walks a directory to build a tree of markdown files.
 */
function buildTree(dir, baseDir = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const tree = [];

    // Sort: folders before files, then alphabetically
    const sortedEntries = entries.sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
            return a.isDirectory() ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    for (const entry of sortedEntries) {
        if (entry.name.startsWith('.')) continue;

        // Directories to skip
        if (entry.isDirectory()) {
            if (['node_modules', '.git', '.obsidian', 'dist', '.venv', '__pycache__', '.next'].includes(entry.name)) {
                continue;
            }

            const fullPath = path.join(dir, entry.name);
            const children = buildTree(fullPath, baseDir);
            
            // Only add folder if it contains markdown files eventually
            if (children.length > 0) {
                tree.push({
                    type: 'folder',
                    name: entry.name,
                    path: path.relative(baseDir, fullPath),
                    children
                });
            }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            tree.push({
                type: 'file',
                name: entry.name.slice(0, -3), // remove .md
                path: path.relative(baseDir, path.join(dir, entry.name))
            });
        }
    }

    return tree;
}

/**
 * Flattens the tree to get all markdown file paths.
 */
function flattenTree(tree, paths = []) {
    for (const node of tree) {
        if (node.type === 'file') {
            paths.push(node.path);
        } else if (node.type === 'folder') {
            flattenTree(node.children, paths);
        }
    }
    return paths;
}

// GET /api/vault/tree?vaultPath=<path>
router.get('/tree', (req, res) => {
    const { vaultPath } = req.query;

    if (!vaultPath) {
        return res.status(400).json({ error: 'vaultPath is required' });
    }

    try {
        const tree = buildTree(vaultPath);
        res.json({ tree });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read vault tree' });
    }
});

// GET /api/vault/smart-tree?vaultPath=<path>
router.get('/smart-tree', async (req, res) => {
    const { vaultPath } = req.query;

    if (!vaultPath) {
        return res.status(400).json({ error: 'vaultPath is required' });
    }

    try {
        const tree = buildTree(vaultPath);
        const filePaths = flattenTree(tree);
        const groups = await organizeVaultStructure(filePaths);
        
        res.json({ 
            groups: groups || [], 
            fallbackTree: tree 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate smart tree' });
    }
});

// GET /api/vault/file?vaultPath=<path>&filePath=<relativePath>
router.get('/file', (req, res) => {
    const { vaultPath, filePath } = req.query;

    if (!vaultPath || !filePath) {
        return res.status(400).json({ error: 'vaultPath and filePath are required' });
    }

    try {
        const absoluteVaultPath = path.resolve(vaultPath);
        const absoluteFilePath = path.resolve(vaultPath, filePath);

        // Path traversal guard
        if (!absoluteFilePath.startsWith(absoluteVaultPath)) {
            return res.status(403).json({ error: 'Access denied: path outside vault' });
        }

        if (!fs.existsSync(absoluteFilePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = fs.readFileSync(absoluteFilePath, 'utf-8');
        const name = path.basename(filePath, '.md');

        res.json({ content, name });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read file' });
    }
});

export default router;
