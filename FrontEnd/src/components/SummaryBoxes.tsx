type SummaryBoxesProps = {
  totalSpent: number;
  transactionCount: number;
};

export function SummaryBoxes({ totalSpent, transactionCount }: SummaryBoxesProps) {
  const cardStyle = { flex: 1, backgroundColor: '#151E2D', padding: '20px', borderRadius: '8px', border: '1px solid #2A3441', textAlign: 'left' as const };
  const labelStyle = { margin: '0 0 10px 0', color: '#64748B', fontSize: '13px', fontWeight: '600' };

  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', width: '100%' }}>
      
      <div style={cardStyle}>
        <h4 style={labelStyle}>Total Transactions</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{transactionCount}</div>
      </div>

      <div style={cardStyle}>
        <h4 style={labelStyle}>Total Income</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>$0.00</div> {/* Placeholder for now! */}
      </div>

      <div style={cardStyle}>
        <h4 style={labelStyle}>Total Expenses</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444' }}>${totalSpent.toFixed(2)}</div>
      </div>

      <div style={cardStyle}>
        <h4 style={labelStyle}>Net Flow</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>${(0 - totalSpent).toFixed(2)}</div>
      </div>

    </div>
  );
}