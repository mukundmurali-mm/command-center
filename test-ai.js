import { organizeVaultStructure } from './server/utils/aiEnhancer.js';
import path from 'path';

async function test() {
    const files = [
        'index.md',
        'about.md',
        'folder1/note1.md',
        'folder1/note2.md'
    ];
    console.log('Testing organizeVaultStructure with paths:', files);
    try {
        const result = await organizeVaultStructure(files);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
