import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function WikiView({ vault, selectedFile }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vault || !selectedFile) return;

    async function fetchFile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/vault/file?vaultPath=${encodeURIComponent(vault.path)}&filePath=${encodeURIComponent(selectedFile.path)}`);
        if (!res.ok) throw new Error('Failed to fetch file');
        const data = await res.json();
        setContent(data.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFile();
  }, [vault, selectedFile]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">{selectedFile?.name}</h1>
      <div className="prose dark:prose-invert prose-indigo max-w-none 
        prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded 
        prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 
        prose-blockquote:border-indigo-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
