export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  date: string;
};

type ExpenseTableProps = {
  expenses: Expense[];
};

export function ExpenseTable({ expenses }: ExpenseTableProps) {
  return (
    <div style={{ marginTop: '40px', textAlign: 'left', backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', borderColor: 'white', border: '2px solid' }}>
      <h3 style={{ borderBottom: '2px solid #3B82F6', paddingBottom: '10px', marginTop: '0', color: 'white' }}>Your Expenses</h3>

      {expenses.length === 0 ? (
        <p style={{ color: 'gray', textAlign: 'center' }}>No expenses added yet. Click "Add New Expense" to get started!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b', fontSize: '14px' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', paddingInlineStart: '30px' }}>Amount</th>
              <th style={{ padding: '12px 8px' }}>Category</th>
              <th style={{ padding: '12px 8px' }}>Description</th>
              <th style={{ padding: '12px 8px' }}>Date</th>
              <th style={{ padding: '12px 8px' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} style={{ borderBottom: '1px solid #1E293B', color: 'white' }}>
                <td style={{ padding: '12px 8px', paddingInlineStart: '30px', textAlign: 'left', fontWeight: 'bold', color: '#ef4444' }}>
                  ${Number(expense.amount).toFixed(2)}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ backgroundColor: '#1bed14', color: 'black', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                    {expense.category}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                  {expense.description}
                </td>
                <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '14px' }}>
                  {expense.date}
                </td>
                <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '14px' }}>
                  {expense.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}