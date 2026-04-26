import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import VaultSwitcher from './components/VaultSwitcher';
import Dashboard from './components/Dashboard';
import WikiView from './components/WikiView';
import { useConfig } from './hooks/useConfig';

export default function App() {
  const { vaults, loading, addVault, removeVault } = useConfig();
  const [activeVaultId, setActiveVaultId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (vaults.length > 0 && !activeVaultId) {
      setActiveVaultId(vaults[0].id);
    }
  }, [vaults, activeVaultId]);

  useEffect(() => {
    setSelectedFile(null);
  }, [activeVaultId]);

  const activeVault = vaults.find(v => v.id === activeVaultId);

  const handleAddVault = async (path) => {
    const newVault = await addVault(path);
    if (newVault) {
      setActiveVaultId(newVault.id);
    }
  };

  useEffect(() => {
    // Global event listeners for components that don't have direct access to App state
    const handleGoHome = () => setSelectedFile(null);
    const handleOpenPicker = async () => {
      try {
        const res = await fetch('/api/config/pick-folder');
        const data = await res.json();
        if (data.path) {
          await handleAddVault(data.path);
        }
      } catch (e) {
        console.error('Folder picker failed', e);
      }
    };

    window.addEventListener('go-home', handleGoHome);
    window.addEventListener('open-vault-picker', handleOpenPicker);
    
    return () => {
      window.removeEventListener('go-home', handleGoHome);
      window.removeEventListener('open-vault-picker', handleOpenPicker);
    };
  }, [activeVaultId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout 
      sidebar={<Sidebar vault={activeVault} onSelectFile={setSelectedFile} selectedFile={selectedFile} />}
      vaultSwitcher={
        <VaultSwitcher 
          vaults={vaults} 
          activeVaultId={activeVaultId} 
          onVaultChange={setActiveVaultId} 
          onAddVault={handleAddVault} 
          onRemoveVault={removeVault} 
        />
      }
    >
      {selectedFile ? (
        <WikiView vault={activeVault} selectedFile={selectedFile} />
      ) : (
        <Dashboard vault={activeVault} />
      )}
    </Layout>
  );
}
