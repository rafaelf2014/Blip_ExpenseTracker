import { Palette, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrency } from '../../context/CurrencyContext';
import { useDate } from '../../context/DateContext';
import { useTranslation } from 'react-i18next';

export function PreferencesSection() {
    const { currency, setCurrency } = useCurrency();
    const { dateFormat, setDateFormat } = useDate();
    const { i18n } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Preferences updated!');
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon icon-purple">
                    <Palette size={20} color="white" />
                </div>
                <h2>Preferences</h2>
            </div>
            <form className="settings-form" onSubmit={handleSubmit}>
                <div className="prefs-grid">
                    <div className="form-group">
                        <label>Currency</label>
                        <select className="form-control" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="BRL">BRL (R$)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Language</label>
                        <select className="form-control" value={i18n.language}
                            onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('app_language', e.target.value); }}>
                            <option value="en">English</option>
                            <option value="pt">Português</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date Format</label>
                        <select className="form-control" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="save-button">
                    <Save size={16} /> Save Preferences
                </button>
            </form>
        </div>
    );
}
