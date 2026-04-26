import React from 'react';
import { useVault } from '../hooks/useVault';

export default function Dashboard({ vault }) {
  const { tree, loading } = useVault(vault);

  const noteCount = tree ? flattenTree(tree).length : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Command Center</h1>
        <p className="text-gray-500 dark:text-gray-400">Your personal knowledge hub, organized by AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">📝 Notes</div>
          <div className="text-3xl font-bold">{loading ? '...' : noteCount}</div>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">🗂 Vault</div>
          <div className="text-3xl font-bold truncate">{vault ? vault.name : 'None'}</div>
        </div>
        <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm">
          <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">✦ Status</div>
          <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">Ready</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 h-48 flex flex-col items-center justify-center text-center">
          <div className="text-lg font-medium mb-1">Recent Notes</div>
          <div className="text-sm text-gray-500 italic">Coming soon...</div>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 h-48 flex flex-col items-center justify-center text-center">
          <div className="text-lg font-medium mb-1">Quick Links</div>
          <div className="text-sm text-gray-500 italic">Coming soon...</div>
        </div>
      </div>
    </div>
  );
}

function flattenTree(tree, paths = []) {
  for (const node of tree) {
    if (node.type === 'file') {
      paths.push(node);
    } else if (node.type === 'folder') {
      flattenTree(node.children, paths);
    }
  }
  return paths;
}
