import { useState } from 'react';
import { Utensils, Car, ShoppingBag, Film, Pill, Zap, DollarSign, Receipt, Briefcase } from 'lucide-react';

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
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn];
    const valB = b[sortColumn];

    if (sortColumn === 'amount') {
      return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }
    if (sortColumn === 'date') {
      return sortDirection === 'asc'
        ? new Date(valA).getTime() - new Date(valB).getTime()
        : new Date(valB).getTime() - new Date(valA).getTime();
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Helper 1: REWRITTEN to force the DD-MM-YYYY format!
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JS!
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString.split(' ')[0]; 
    }
  };

  // Helper 2: Increased icon sizes to 22!
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('restaurant')) return <Utensils size={22} />;
    if (cat.includes('transport') || cat.includes('uber') || cat.includes('gas')) return <Car size={22} />;
    if (cat.includes('shopping') || cat.includes('store')) return <ShoppingBag size={22} />;
    if (cat.includes('entertainment') || cat.includes('netflix')) return <Film size={22} />;
    if (cat.includes('health') || cat.includes('pharmacy')) return <Pill size={22} />;
    if (cat.includes('income') || cat.includes('salary')) return <DollarSign size={22} />;
    if (cat.includes('bills') || cat.includes('electric')) return <Zap size={22} />;
    if (cat.includes('freelance') || cat.includes('work')) return <Briefcase size={22} />;
    return <Receipt size={22} />;
  };

  return (
    <div style={{ marginTop: '20px', backgroundColor: '#151E2D', borderRadius: '12px', border: '1px solid #2A3441', overflow: 'hidden' }}>
      
      {expenses.length === 0 ? (
        <p style={{ color: '#64748B', textAlign: 'center', padding: '60px', fontSize: '20px' }}>No transactions found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            {/* Bumped Header Font Size */}
            <tr style={{ borderBottom: '1px solid #2A3441', color: '#94A3B8', fontSize: '16px' }}>
              <th onClick={() => handleSort('description')} style={{ padding: '24px 20px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Transaction {getSortIcon('description')}
              </th>
              <th onClick={() => handleSort('category')} style={{ padding: '24px 20px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Category {getSortIcon('category')}
              </th>
              <th onClick={() => handleSort('date')} style={{ padding: '24px 20px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Date {getSortIcon('date')}
              </th>
              <th onClick={() => handleSort('type')} style={{ padding: '24px 20px', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                Type {getSortIcon('type')}
              </th>
              <th onClick={() => handleSort('amount')} style={{ padding: '24px 20px', cursor: 'pointer', userSelect: 'none', fontWeight: '600', textAlign: 'right' }}>
                Price {getSortIcon('amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} style={{ borderBottom: '1px solid #2A3441', color: '#F8FAFC', transition: 'background-color 0.2s' }}>
                
                {/* Bigger Description Text (18px) and Icon Circle (48px) */}
                <td style={{ padding: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '18px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', flexShrink: 0 }}>
                    {getCategoryIcon(expense.category)}
                  </div>
                  {expense.description}
                </td>

                {/* Bigger Pill */}
                <td style={{ padding: '20px' }}>
                  <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', padding: '10px 16px', borderRadius: '20px', fontSize: '15px', fontWeight: '600' }}>
                    {expense.category}
                  </span>
                </td>

                {/* Formatted Date & Larger Text */}
                <td style={{ padding: '20px', color: '#94A3B8', fontSize: '17px' }}>
                  {formatDate(expense.date)}
                </td>

                {/* Type */}
                <td style={{ padding: '20px', color: '#94A3B8', fontSize: '17px', textTransform: 'capitalize' }}>
                  {expense.type || 'Standard'}
                </td>

                {/* Hero Price Text (20px) */}
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 'bold', color: Number(expense.amount) > 0 ? '#EF4444' : '#10B981', fontSize: '20px' }}>
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