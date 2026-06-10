import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import "../styles/ExpenseTable.scss";
import { useCurrency } from '../Context/CurrencyContext';
import { useDate } from '../Context/DateContext';
import type { Expense } from '../types';
import { getCategoryIcon } from '../utils/iconMapping';

type ExpenseTableProps = {
  expenses: Expense[];
  totalCount: number;
  onEditClick: (expense: Expense) => void;
};

type SortColumn = 'amount' | 'category' | 'description' | 'date' | 'type' | null;
type SortDirection = 'asc' | 'desc';

export function ExpenseTable({ expenses, totalCount, onEditClick }: ExpenseTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDate();
  const itemsPerPage = 10;

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

    if (sortColumn === 'amount')
      return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    if (sortColumn === 'date')
      return sortDirection === 'asc'
        ? new Date(valA).getTime() - new Date(valB).getTime()
        : new Date(valB).getTime() - new Date(valA).getTime();
    if (typeof valA === 'string' && typeof valB === 'string')
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return 0;
  });

  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);

  // recua para a última página se o conteúdo encolher (ex: apagar o último item)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex      = (currentPage - 1) * itemsPerPage;
  const currentExpenses = sortedExpenses.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className='expense-table-container'>
      {expenses.length === 0 ? (
        <p className='empty-state'>
          {totalCount === 0 ? t('dashboard.empty_transactions') : t('expenseTable.empty')}
        </p>
      ) : (
        <>
          <table className='expense-table'>
            <thead>
              <tr>
                <th className='sortable' onClick={() => handleSort('description')}>{t('expenseTable.transaction')} {getSortIcon('description')}</th>
                <th className='sortable' onClick={() => handleSort('category')}>{t('expenseTable.category')} {getSortIcon('category')}</th>
                <th className='sortable' onClick={() => handleSort('date')}>{t('expenseTable.date')} {getSortIcon('date')}</th>
                <th className='sortable' onClick={() => handleSort('type')}>{t('expenseTable.type')} {getSortIcon('type')}</th>
                <th className='sortable text-center' onClick={() => handleSort('amount')}>{t('expenseTable.price')} {getSortIcon('amount')}</th>
                <th className='text-center'>{t('expenseTable.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className='desc-col'>
                    <div className='icon-wrapper'>{getCategoryIcon(expense.category)}</div>
                    {expense.description}
                  </td>
                  <td className='category-col'>
                    <span className='category-pill'>{expense.category}</span>
                  </td>
                  <td className='date-col'>{formatDate(expense.date)}</td>
                  <td className='type-col capitalize'>{expense.type || 'Standard'}</td>
                  <td className={`amount-col ${Number(expense.amount) > 0 ? 'expense' : 'income'}`}>
                    {formatCurrency(Number(expense.amount))}
                  </td>
                  <td className='actions-col'>
                    <button className='action-btn' onClick={() => onEditClick(expense)}>
                      ···
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="table-pagination">
              <span className="pagination-info">
                {t('expenseTable.pagination_showing', {
                  start: startIndex + 1,
                  end: Math.min(startIndex + itemsPerPage, sortedExpenses.length),
                  total: sortedExpenses.length,
                })}
              </span>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={16} /> {t('expenseTable.previous')}
                </button>
                <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                  {t('expenseTable.next')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
