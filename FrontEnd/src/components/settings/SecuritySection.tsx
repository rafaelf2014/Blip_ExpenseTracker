import { useState } from 'react';
import { Lock, Save } from 'lucide-react';

interface SecuritySectionProps {
    loading: boolean;
    savePassword: (current: string, newPwd: string, confirm: string) => Promise<boolean>;
}

export function SecuritySection({ loading, savePassword }: SecuritySectionProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await savePassword(currentPassword, newPassword, confirmPassword);
        if (ok) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon"><Lock size={20} color="white" /></div>
                <h2>Security</h2>
            </div>
            <form className="settings-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Current Password</label>
                    <input className="form-control" type="password" value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password" required />
                </div>
                <div className="form-group">
                    <label>New Password</label>
                    <input className="form-control" type="password" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password" required />
                </div>
                <div className="form-group">
                    <label>Confirm New Password</label>
                    <input className="form-control" type="password" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password" required />
                </div>
                <button type="submit" className="save-button" disabled={loading}>
                    <Save size={16} />{loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
