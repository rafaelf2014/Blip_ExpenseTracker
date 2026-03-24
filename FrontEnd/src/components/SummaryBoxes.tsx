type SummaryBoxesProps = {
  totalSpent: number;
  transactionCount: number;
};

export function SummaryBoxes({ totalSpent, transactionCount }: SummaryBoxesProps) {
  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', width: '100%' }}>
      {/* Box 1: Total Spent */}
      <div style={{ flex: 1, backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', border: '1px solid #3B82F6', textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>Total Spent</h4>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
          ${totalSpent.toFixed(2)}
        </div>
      </div>

      {/* Box 2: Transaction Count */}
      <div style={{ flex: 1, backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', border: '1px solid #10B981', textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>Transactions</h4>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
          {transactionCount}
        </div>
      </div>

      {/* Box 3: Future Feature Placeholder */}
      <div style={{ flex: 1, backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', border: '1px dashed #475569', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Future Feature</span>
      </div>

      {/* Box 4: Future Feature Placeholder */}
      <div style={{ flex: 1, backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', border: '1px dashed #475569', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Future Feature</span>
      </div>
    </div>
  );
}