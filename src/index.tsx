import React, { useRef, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

export function App() {
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = contentRef.current?.value || "";
        if (!content.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("/save", {
                method: "POST",
                body: content,
            });
            const url = await res.text();
            window.open(url, '_blank'); // Open URL in new tab
            if (contentRef.current) contentRef.current.value = "";
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const content = contentRef.current?.value || "";
                if (content.trim()) {
                    handleSubmit(new Event('submit') as unknown as React.FormEvent);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-4">Paste It</h1>

            <form onSubmit={handleSubmit} className="mb-4">
                <textarea
                    ref={contentRef}
                    className="w-full h-64 p-2 rounded bg-zinc-700 text-zinc-200 mb-2 focus:outline-none"
                    defaultValue=""
                    placeholder="Paste your content here..."
                />
                <p className="text-sm text-zinc-400">
                    Press <kbd className="bg-zinc-600 px-1 rounded">Ctrl+S</kbd> to save and open in new tab
                </p>
            </form>
        </div>
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const root = createRoot(document.getElementById("root") as HTMLElement);
    root.render(<App />);
});