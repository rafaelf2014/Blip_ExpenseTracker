import { useState } from 'react';
import { Utensils, Car, ShoppingBag, Film, Pill, Zap, DollarSign, Receipt, Briefcase, MoreHorizontal } from 'lucide-react';
import "../styles/ExpenseTable.scss";

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
  onEditClick: (expense: Expense) => void;
};


type SortColumn = 'amount' | 'category' | 'description' | 'date' | 'type' | null;
type SortDirection = 'asc' | 'desc';

export function ExpenseTable({ expenses, onEditClick }: ExpenseTableProps) {
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

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString.split(' ')[0];
    }
  };

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
    <div className='expense-table-container'>

      {expenses.length === 0 ? (
        <p className='empty-state'>No transactions found.</p>
      ) : (
        <table className='expense-table'>
          <thead>
            <tr>
              <th className='sortable' onClick={() => handleSort('description')} >
                Transaction {getSortIcon('description')}
              </th>
              <th className='sortable' onClick={() => handleSort('category')} >
                Category {getSortIcon('category')}
              </th>
              <th className='sortable' onClick={() => handleSort('date')} >
                Date {getSortIcon('date')}
              </th>
              <th className='sortable' onClick={() => handleSort('type')} >
                Type {getSortIcon('type')}
              </th>
              <th className='sortable text-center' onClick={() => handleSort('amount')} >
                Price {getSortIcon('amount')}
              </th>
              <th className='text-center'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} >

                <td className='desc-col'>
                  <div className='icon-wrapper'>
                    {getCategoryIcon(expense.category)}
                  </div>
                  {expense.description}
                </td>

                <td className='category-col'>
                  <span className='category-pill'>
                    {expense.category}
                  </span>
                </td>

                <td className='date-col' >
                  {formatDate(expense.date)}
                </td>

                <td className='type-col capitalize' >
                  {expense.type || 'Standard'}
                </td>

                <td className={`amount-col ${Number(expense.amount) > 0 ? 'expense' : 'income'}`} >
                  ${Number(expense.amount).toFixed(2)}
                </td>
                <td className='actions-col' >
                  <button className='action-btn' onClick={() => onEditClick(expense)}>
                    <MoreHorizontal size={24} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}