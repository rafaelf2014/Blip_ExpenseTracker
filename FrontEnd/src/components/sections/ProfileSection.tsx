import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Save, Camera } from 'lucide-react';

interface ProfileSectionProps {
    username: string;
    setUsername: (v: string) => void;
    profilePicture: string;
    setProfilePicture: (v: string) => void;
    loading: boolean;
    saveProfile: (username: string, picture: string) => Promise<void>;
}

export function ProfileSection({ username, setUsername, profilePicture, setProfilePicture, loading, saveProfile }: ProfileSectionProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setProfilePicture(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveProfile(username, profilePicture);
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon"><User size={20} color="white" /></div>
                <h2>{t('settings.profile')}</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="profile-form-inner">
                    <div className="profile-fields">
                        <div className="form-group">
                            <label>{t('settings.username')}</label>
                            <input className="form-control" type="text" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('settings.username')} required />
                        </div>
                        <button type="submit" className="save-button" disabled={loading}>
                            <Save size={16} />{t('settings.save')}
                        </button>
                    </div>
                    <div className="avatar-section">
                        <div className="avatar-circle" onClick={() => fileInputRef.current?.click()}>
                            {profilePicture
                                ? <img src={profilePicture} alt="Profile" />
                                : <Camera size={28} color="#64748B" />}
                        </div>
                        <span className="avatar-hint">Click to change</span>
                        <input ref={fileInputRef} type="file" accept="image/*"
                            style={{ display: 'none' }} onChange={handleFileChange} />
                    </div>
                </div>
            </form>
        </div>
    );
}
