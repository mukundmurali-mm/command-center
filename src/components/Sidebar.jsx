import React, { useState, useEffect } from 'react';
import { useVault } from '../hooks/useVault';

function FileNode({ node, depth, onSelect, selectedPath }) {
  const [isOpen, setIsOpen] = useState(depth === 0);

  if (node.type === 'folder') {
    return (
      <div className="flex flex-col">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 py-1 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && (
          <div className="flex flex-col">
            {node.children.map(child => (
              <FileNode key={child.path} node={child} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={() => onSelect(node)}
      className={`w-full text-left py-1 px-2 text-sm rounded-md transition-colors truncate ${
        selectedPath === node.path 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {node.name}
    </button>
  );
}

function TopicGroup({ group, allFiles, onSelect, selectedPath }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1 px-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        <span>{group.icon} {group.name}</span>
      </button>
      {isOpen && (
        <div className="flex flex-col mt-1">
          {group.files.map(filePath => {
            const file = allFiles.find(f => f.path === filePath);
            if (!file) return null;
            return (
              <button 
                key={file.path}
                onClick={() => onSelect(file)}
                className={`w-full text-left py-1 px-2 text-sm rounded-md transition-colors truncate ${
                  selectedPath === file.path 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{ paddingLeft: '24px' }}
              >
                {file.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ vault, onSelectFile, selectedFile }) {
  const [view, setView] = useState('folders'); // 'folders' | 'topics'
  const { tree, loading, error } = useVault(vault);

  const fetchSmartTree = async () => {
    try {
      const res = await fetch(`/api/vault/smart-tree?vaultPath=${encodeURIComponent(vault.path)}`);
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  const [smartTree, setSmartTree] = useState(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState(null);

  useEffect(() => {
    if (view === 'topics' && vault) {
      if (smartTree && smartTree.vaultPath === vault.path) {
        return;
      }
      setSmartLoading(true);
      setSmartError(null);
      fetchSmartTree().then(data => {
        if (data) {
          setSmartTree({ ...data, vaultPath: vault.path });
        } else {
          setSmartError('AI failed to organize these files. Please try again later.');
        }
        setSmartLoading(false);
      });
    }
  }, [view, vault, smartTree]);

  if (!vault) {
    return (
      <div className="flex flex-col gap-3 p-2">
        <div className="p-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 mb-3">No vault connected</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-vault-picker'))}
            className="w-full py-2 px-3 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            📂 Browse for Vault
          </button>
        </div>
      </div>
    );
  }

      const allFiles = (tree || smartTree?.fallbackTree) ? flattenTree(tree || smartTree.fallbackTree) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
        <button 
          onClick={() => setView('folders')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${view === 'folders' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📁 Folders
        </button>
        <button 
          onClick={() => setView('topics')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${view === 'topics' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          ✦ Topics
        </button>
      </div>

      <div className="overflow-auto flex-1">
        {loading && <div className="p-4 text-center text-xs text-gray-500 animate-pulse">Loading vault...</div>}
        {error && <div className="p-4 text-center text-xs text-red-500">{error}</div>}
        
        {view === 'folders' && tree && (
          <div className="flex flex-col gap-1">
            {tree.map(node => (
              <FileNode key={node.path} node={node} depth={0} onSelect={onSelectFile} selectedPath={selectedFile?.path} />
            ))}
          </div>
        )}

        {view === 'topics' && (
          <div className="flex flex-col gap-1">
            {smartLoading && <div className="p-4 text-center text-xs text-gray-500 animate-pulse">AI is organizing...</div>}
             {smartError && <div className="p-4 text-center text-xs text-red-500">{smartError}</div>}
             {allFiles.length > 150 && !smartLoading && <div className="p-2 text-center text-[10px] text-gray-400 italic">Only the first 150 files are organized by AI.</div>}
            {!smartLoading && !smartError && smartTree?.groups?.map(group => (
              <TopicGroup key={group.name} group={group} allFiles={allFiles} onSelect={onSelectFile} selectedPath={selectedFile?.path} />
            ))}
          </div>
        )}
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
