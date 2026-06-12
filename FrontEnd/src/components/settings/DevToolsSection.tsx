import { useState } from 'react';
import { Terminal, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'blip_unknown_terms';

export function DevToolsSection() {
    const [count, setCount] = useState<number>(
        () => (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]).length
    );

    const handleExport = () => {
        const terms = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
        if (terms.length === 0) { toast.error('No unknown terms stored.'); return; }

        const blob = new Blob([JSON.stringify(terms, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `blip_unknown_terms_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${terms.length} term(s).`);
    };

    const handleClear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setCount(0);
        toast.success('Unknown terms cleared.');
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon icon-slate">
                    <Terminal size={20} color="white" />
                </div>
                <h2>Dev Tools</h2>
            </div>
            <div className="settings-form">
                <p className="devtools-hint">
                    Unknown terms collected by the AI keyword classifier: <strong>{count}</strong>
                </p>
                <div className="devtools-actions">
                    <button type="button" className="save-button" onClick={handleExport}>
                        <Download size={16} /> Export JSON
                    </button>
                    <button type="button" className="save-button btn-danger" onClick={handleClear}>
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </div>
        </div>
    );
}
