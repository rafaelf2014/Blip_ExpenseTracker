import { Zap, Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLLMStatus } from '../hooks/useLLMStatus';
import '../styles/AddExpenseButton.scss';

type AddExpenseButtonProps = {
  onAddManual: () => void;
  onAddAi: () => void;
};

/**
 * Desktop: an inline split button (manual "+ Add Expense" + AI ⚡ quick-add).
 * Mobile: a floating action cluster — a small ⚡ AI button above the main + button.
 * The two share handlers; CSS swaps which form is visible at the breakpoint.
 */
export function AddExpenseButton({ onAddManual, onAddAi }: AddExpenseButtonProps) {
  const { t } = useTranslation();
  const loading = useLLMStatus() === 'loading';

  const aiIcon = loading ? <Loader2 size={18} className="spin-anim" /> : <Zap size={18} />;
  const aiLabel = loading ? t('aiMenu.loading') : t('aiMenu.button_title');

  return (
    <>
      {/* Desktop split button */}
      <div className="add-expense-split">
        <button className="add-manual-btn" onClick={onAddManual}>
          {t('filters.add_expense')}
        </button>
        <button className="add-ai-btn" onClick={onAddAi} title={aiLabel} aria-label={aiLabel}>
          {aiIcon}
        </button>
      </div>

      {/* Mobile floating action cluster — AI quick-add is the primary action */}
      <div className="add-expense-fab">
        <button className="fab-manual" onClick={onAddManual} aria-label={t('filters.add_expense')}>
          <Plus size={20} />
        </button>
        <button className="fab-main" onClick={onAddAi} title={aiLabel} aria-label={aiLabel}>
          {loading ? <Loader2 size={26} className="spin-anim" /> : <Zap size={26} />}
        </button>
      </div>
    </>
  );
}
