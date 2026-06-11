import { Sidebar } from '../components/Sidebar';
import { LogoutButton } from '../components/LogoutButton';
import { useTranslation } from 'react-i18next';
import '../styles/Settings.scss';
import { useSettings } from '../hooks/useSettings';
import { FinancialSection } from '../components/settings/FinancialSection';
import { BudgetsSection } from '../components/settings/BudgetsSection';

export default function Planning() {
    const { t } = useTranslation();
    const {
        currentBalance, setCurrentBalance,
        regularTransactions, setRegularTransactions,
        budgets, setBudgets,
        saveFinancial, saveBudgets,
    } = useSettings();

    return (
        <div className="settings-layout">
            <Sidebar />
            <main className="settings-page">
                <div className="settings-header">
                    <div>
                        <h1>{t('planning.title')}</h1>
                        <p>{t('planning.subtitle')}</p>
                    </div>
                    <LogoutButton />
                </div>
                <div className="settings-grid">
                    <div className="settings-row-two">
                        <FinancialSection
                            currentBalance={currentBalance} setCurrentBalance={setCurrentBalance}
                            regularTransactions={regularTransactions} setRegularTransactions={setRegularTransactions}
                            saveFinancial={saveFinancial}
                        />
                        <BudgetsSection budgets={budgets} setBudgets={setBudgets} saveBudgets={saveBudgets} />
                    </div>
                </div>
            </main>
        </div>
    );
}
