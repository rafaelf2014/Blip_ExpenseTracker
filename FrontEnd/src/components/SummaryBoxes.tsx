import '../styles/SummaryBoxes.scss';
import { useCurrency } from '../Context/CurrencyContext';

type SummaryBoxesProps = {
  totalSpent: number;
  transactionCount: number;
};

export function SummaryBoxes({ totalSpent, transactionCount }: SummaryBoxesProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className='summary-boxes-container'>

      <div className='summary-card'>
        <h4 className='summary-label'>Total Transactions</h4>
        <div className='summary-value neutral'> {transactionCount} </div>
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>Total Income</h4>
        <div className='summary-value positive'>{formatCurrency(0)}</div> {/* Placeholder for now! */}
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>Total Expenses</h4>
        <div className='summary-value negative'>{formatCurrency(totalSpent)}</div>
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>Net Flow</h4>
        <div className='summary-value positive'>{formatCurrency(0 - totalSpent)}</div>
      </div>

    </div>
  );
}