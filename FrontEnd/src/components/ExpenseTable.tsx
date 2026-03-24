import { useState } from 'react';

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

type SortColumn = 'amount' | 'category' | 'description' | 'date' | 'type' | null;
type SortDirection = 'asc' | 'desc';

export function ExpenseTable({ expenses }: ExpenseTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // If clicking the same column, just flip the direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new column, set it to that column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (!sortColumn) return 0;

    const valA = a[sortColumn];
    const valB = b[sortColumn];

    // Number Sorting (Amount)
    if (sortColumn === 'amount') {
      return sortDirection === 'asc' 
        ? Number(valA) - Number(valB) 
        : Number(valB) - Number(valA);
    }

    // Date Sorting
    if (sortColumn === 'date') {
      return sortDirection === 'asc'
        ? new Date(valA).getTime() - new Date(valB).getTime()
        : new Date(valB).getTime() - new Date(valA).getTime();
    }

    // Alphabetical String Sorting (Category, Description, Type)
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return 0;
  });

  // A tiny helper to draw the up/down arrows on the headers
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };


  return (
    <div style={{ marginTop: '20px', backgroundColor: '#151E2D', borderRadius: '8px', border: '1px solid #2A3441', overflow: 'hidden' }}>
      
      {expenses.length === 0 ? (
        <p style={{ color: '#64748B', textAlign: 'center', padding: '40px' }}>No transactions found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A3441', color: '#64748B', fontSize: '13px' }}>
              <th onClick={() => handleSort('description')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Transaction {getSortIcon('description')}
              </th>
              <th onClick={() => handleSort('category')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Category {getSortIcon('category')}
              </th>
              <th onClick={() => handleSort('date')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Date {getSortIcon('date')}
              </th>
              <th onClick={() => handleSort('amount')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', fontWeight: '600', textAlign: 'right' }}>
                Amount {getSortIcon('amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} style={{ borderBottom: '1px solid #2A3441', color: '#F8FAFC', fontSize: '14px' }}>
                <td style={{ padding: '16px', fontWeight: '500' }}>
                  {expense.description}
                </td>
                <td style={{ padding: '16px' }}>
                  {/* The dark pill badge from the mockup! */}
                  <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                    {expense.category}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#94A3B8' }}>
                  {expense.date}
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#EF4444' }}>
                  {/* Mockup uses Red for expenses! */}
                  ${Number(expense.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}