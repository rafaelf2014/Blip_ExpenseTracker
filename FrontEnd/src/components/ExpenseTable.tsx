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
    <div style={{ marginTop: '40px', textAlign: 'left', backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', borderColor: 'white', border: '2px solid' }}>
      <h3 style={{ borderBottom: '2px solid #3B82F6', paddingBottom: '10px', marginTop: '0', color: 'white' }}>Your Expenses</h3>

      {expenses.length === 0 ? (
        <p style={{ color: 'gray', textAlign: 'center' }}>No expenses added yet. Click "Add New Expense" to get started!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b', fontSize: '14px' }}>
              
              {/* 4. Make each header clickable and add the arrow icon! */}
              <th onClick={() => handleSort('amount')} style={{ padding: '12px 8px', textAlign: 'left', paddingInlineStart: '30px', cursor: 'pointer', userSelect: 'none' }}>
                Amount {getSortIcon('amount')}
              </th>
              <th onClick={() => handleSort('category')} style={{ padding: '12px 8px', cursor: 'pointer', userSelect: 'none' }}>
                Category {getSortIcon('category')}
              </th>
              <th onClick={() => handleSort('description')} style={{ padding: '12px 8px', cursor: 'pointer', userSelect: 'none' }}>
                Description {getSortIcon('description')}
              </th>
              <th onClick={() => handleSort('date')} style={{ padding: '12px 8px', cursor: 'pointer', userSelect: 'none' }}>
                Date {getSortIcon('date')}
              </th>
              <th onClick={() => handleSort('type')} style={{ padding: '12px 8px', cursor: 'pointer', userSelect: 'none' }}>
                Type {getSortIcon('type')}
              </th>

            </tr>
          </thead>
          <tbody>
            {/* 5. Map over the SORTED array instead of the raw array */}
            {sortedExpenses.map((expense) => (
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