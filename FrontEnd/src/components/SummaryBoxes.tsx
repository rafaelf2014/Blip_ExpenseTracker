import '../styles/SummaryBoxes.scss';

type SummaryBoxesProps = {
  totalSpent: number;
  transactionCount: number;
};

export function SummaryBoxes({ totalSpent, transactionCount }: SummaryBoxesProps) {
  return (
    <div className='summary-boxes-container'>

      <div className='summary-card'>
        <h4 className='summary-label'>Total Transactions</h4>
        <div className='summary-value neutral'> {transactionCount} </div>
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>Total Income</h4>
        <div className='summary-value positive'>$0.00</div> {/* Placeholder for now! */}
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>Total Expenses</h4>
        <div className='summary-value negative'>${totalSpent.toFixed(2)}</div>
      </div>

      <div className='summary-card'>
        <h4 className='summary-label'>Net Flow</h4>
        <div className='summary-value positive'>${(0 - totalSpent).toFixed(2)}</div>
      </div>

    </div>
  );
}