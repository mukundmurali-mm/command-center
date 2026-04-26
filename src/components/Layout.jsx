import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'wiki', icon: '📖', label: 'Wiki' },
];

export default function Layout({ children, sidebar, vaultSwitcher }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch('/api/version');
        const data = await res.json();
        if (data.updateAvailable) {
          setUpdateInfo(data);
        }
      } catch (e) {
        console.error('Version check failed', e);
      }
    }
    checkVersion();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      {updateInfo && !bannerDismissed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white px-4 py-2 text-sm flex justify-between items-center animate-in fade-in slide-in-from-top">
          <span>
            v{updateInfo.latest} is available — run <code className="bg-indigo-700 px-1 rounded">command-center --update</code> to upgrade.{' '}
            <a href={updateInfo.releaseUrl} target="_blank" className="underline ml-2 hover:text-indigo-200">What's new</a>
          </span>
          <button onClick={() => setBannerDismissed(true)} className="hover:text-indigo-200 px-2">×</button>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('go-home'))}>
            <span className="text-indigo-600">⌘</span> Command Center
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vaultSwitcher}
        </div>
      </header>

      <aside className={`fixed left-0 top-14 bottom-0 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-30 ${isCollapsed ? 'w-10' : 'w-64'}`}>
        <div className={`flex flex-col h-full ${isCollapsed ? 'items-center' : 'p-3'}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div title="Wiki" className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                <span>📖</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-gray-500 uppercase tracking-wider">
                  <span>📖</span> Wiki
                </div>
                {sidebar}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 pt-14 ${isCollapsed ? 'pl-10' : 'pl-64'}`}>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
