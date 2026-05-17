import { useRef } from 'react';
import { User, Save, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProfileSectionProps {
    username: string;
    setUsername: (v: string) => void;
    profilePicture: string;
    setProfilePicture: (v: string) => void;
    loading: boolean;
    saveProfile: (username: string, picture: string) => Promise<void>;
}

export function ProfileSection({ username, setUsername, profilePicture, setProfilePicture, loading, saveProfile }: ProfileSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

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
                <h2>{t('settings.profile.title')}</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="profile-form-inner">
                    <div className="profile-fields">
                        <div className="form-group">
                            <label>{t('settings.profile.username')}</label>
                            <input className="form-control" type="text" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('settings.profile.username_placeholder')} required />
                        </div>
                        <button type="submit" className="save-button" disabled={loading}>
                            <Save size={16} />{loading ? 'Saving...' : t('settings.save')}
                        </button>
                    </div>
                    <div className="avatar-section">
                        <div className="avatar-circle" onClick={() => fileInputRef.current?.click()}>
                            {profilePicture
                                ? <img src={profilePicture} alt="Profile" />
                                : <Camera size={28} color="#64748B" />}
                        </div>
                        <span className="avatar-hint">{t('settings.profile.image')}</span>
                        <input ref={fileInputRef} type="file" accept="image/*"
                            style={{ display: 'none' }} onChange={handleFileChange} />
                    </div>
                </div>
            </form>
        </div>
    );
}
