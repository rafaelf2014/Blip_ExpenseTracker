import { Sidebar } from '../components/Sidebar';
import { LogoutButton } from '../components/LogoutButton';
import { useTranslation } from 'react-i18next';
import '../styles/Settings.scss';
import { useSettings } from '../hooks/useSettings';
import { ProfileSection } from '../components/settings/ProfileSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { PreferencesSection } from '../components/settings/PreferencesSection';
import { DevToolsSection } from '../components/settings/DevToolsSection';

export default function Settings() {
    const { t } = useTranslation();
    const {
        username, setUsername,
        profilePicture, setProfilePicture,
        loading,
        saveProfile, savePassword,
    } = useSettings();

    return (
        <div className="settings-layout">
            <Sidebar />
            <main className="settings-page">
                <div className="settings-header">
                    <div>
                        <h1>{t('settings.title')}</h1>
                        <p>{t('settings.subtitle')}</p>
                    </div>
                    <LogoutButton />
                </div>
                <div className="settings-grid">
                    <div className="settings-row-two">
                        <ProfileSection
                            username={username} setUsername={setUsername}
                            profilePicture={profilePicture} setProfilePicture={setProfilePicture}
                            loading={loading} saveProfile={saveProfile}
                        />
                        <SecuritySection loading={loading} savePassword={savePassword} />
                    </div>
                    <div className="settings-row-two">
                        <PreferencesSection />
                        <DevToolsSection />
                    </div>
                </div>
            </main>
        </div>
    );
}
