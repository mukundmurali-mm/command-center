import { useState, useEffect } from 'react';

export function useVault(vault) {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!vault?.path) {
            setTree(null);
            return;
        }

        async function fetchTree() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/vault/tree?vaultPath=${encodeURIComponent(vault.path)}`);
                if (!res.ok) throw new Error('Failed to fetch vault tree');
                const data = await res.json();
                setTree(data.tree);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchTree();
    }, [vault]);

    return { tree, loading, error };
}
