import { Sidebar } from '../components/Sidebar';
import '../styles/Settings.scss';
import { useSettings } from '../hooks/useSettings';
import { ProfileSection } from '../components/settings/ProfileSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { FinancialSection } from '../components/settings/FinancialSection';
import { BudgetsSection } from '../components/settings/BudgetsSection';
import { PreferencesSection } from '../components/settings/PreferencesSection';
import { DevToolsSection } from '../components/settings/DevToolsSection';

export default function Settings() {
    const {
        username, setUsername,
        profilePicture, setProfilePicture,
        loading,
        currentBalance, setCurrentBalance,
        regularTransactions, setRegularTransactions,
        budgets, setBudgets,
        saveProfile, savePassword, saveFinancial, saveBudgets,
    } = useSettings();

    return (
        <div className="settings-layout">
            <Sidebar />
            <main className="settings-page">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p>Manage your account and preferences</p>
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
                    <FinancialSection
                        currentBalance={currentBalance} setCurrentBalance={setCurrentBalance}
                        regularTransactions={regularTransactions} setRegularTransactions={setRegularTransactions}
                        saveFinancial={saveFinancial}
                    />
                    <BudgetsSection budgets={budgets} setBudgets={setBudgets} saveBudgets={saveBudgets} />
                    <PreferencesSection />
                    <DevToolsSection />
                </div>
            </main>
        </div>
    );
}
