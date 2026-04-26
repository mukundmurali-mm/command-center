import { useState, useEffect } from 'react';

export function useConfig() {
    const [vaults, setVaults] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            setVaults(data.vaults || []);
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const addVault = async (path) => {
        try {
            const res = await fetch('/api/config/vaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path }),
            });
            if (res.ok) {
                const newVault = await res.json();
                setVaults(prev => [...prev, newVault]);
                return newVault;
            }
        } catch (error) {
            console.error('Error adding vault:', error);
        }
    };

    const removeVault = async (id) => {
        try {
            const res = await fetch(`/api/config/vaults/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setVaults(prev => prev.filter(v => v.id !== id));
            }
        } catch (error) {
            console.error('Error removing vault:', error);
        }
    };

    return { vaults, loading, addVault, removeVault };
}
