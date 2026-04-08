import '../styles/SummaryBoxes.scss';
import { useCurrency } from '../Context/CurrencyContext';
import { useTranslation } from 'react-i18next';

type SummaryBoxesProps = {
  totalSpent: number;
  transactionCount: number;
};

export function SummaryBoxes({ totalSpent, transactionCount }: SummaryBoxesProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  return (
    <div className='summary-boxes-container'>

      <div className='summary-card'>
        <h4 className='summary-label'>{t('summaryBoxes.totalTransactions')}</h4>
        <div className='summary-value neutral'> {transactionCount} </div>
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>{t('summaryBoxes.totalIncome')}</h4>
        <div className='summary-value positive'>{formatCurrency(0)}</div> {/* Placeholder for now! */}
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>{t('summaryBoxes.totalExpenses')}</h4>
        <div className='summary-value negative'>{formatCurrency(totalSpent)}</div>
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>{t('summaryBoxes.netBalance')}</h4>
        <div className='summary-value positive'>{formatCurrency(0 - totalSpent)}</div>
      </div>

    </div>
  );
}