import React, { useState } from 'react';

export default function VaultSwitcher({ vaults, activeVaultId, onVaultChange, onAddVault, onRemoveVault }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeVault = vaults.find(v => v.id === activeVaultId);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-gray-500">📂</span>
        {activeVault ? activeVault.name : 'Select Vault'}
        <span className="text-gray-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-1 flex flex-col gap-1">
            {vaults.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 italic">No vaults connected</div>
            )}
            {vaults.map(v => (
              <div 
                key={v.id} 
                className="group flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => { onVaultChange(v.id); setIsOpen(false); }}
              >
                <span className="truncate">
                  {v.id === activeVaultId ? '✓ ' : ''}{v.name}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveVault(v.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
            <button 
              onClick={() => { window.dispatchEvent(new CustomEvent('open-vault-picker')); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
            >
              + Add Vault
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
