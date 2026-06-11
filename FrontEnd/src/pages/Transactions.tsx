import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ExpenseTable } from '../components/ExpenseTable';
import { FilterControls } from '../components/FilterControl';
import { SummaryCard } from '../components/SummaryBoxes';
import '../styles/Transactions.scss';
import { AiExpenseModal } from '../components/AiExpenseModal';
import { LogoutButton } from '../components/LogoutButton';
import { Receipt, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../Context/CurrencyContext';
import { useTransactions } from '../hooks/useTransactions';

export default function Transactions() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [showAiMenu, setShowAiMenu] = useState(false);
  const {
    userId,
    showForm, setShowForm,
    categories, expenseTypes,
    expenses, filteredExpenses,
    searchTerm, setSearchTerm,
    showFilters, setShowFilters,
    filterCategory, setFilterCategory,
    filterType, setFilterType,
    filterTime, setFilterTime,
    filterMin, setFilterMin,
    filterMax, setFilterMax,
    editingExpense, setEditingExpense,
    fetchExpenses,
    handleUpdateExpense,
    handleDeleteExpense,
    periodLabel, displayedSpent, displayedIncome, netBalance,
  } = useTransactions();


  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div className="header-title">
              <h2>{t('transactions.title')}</h2>
              <p>{t('transactions.subtitle')}</p>
            </div>
            <div className='header-actions'>
              <LogoutButton />
            </div>
          </header>

          <div className="summary-boxes-container">
            <SummaryCard
              title={t('transactions.count')}
              value={`${filteredExpenses.length}`}
              icon={Receipt}
              type="expense"
            />
            <SummaryCard
              title={periodLabel ? t('transactions.spent') : t('transactions.total_spent')}
              value={formatCurrency(displayedSpent)}
              icon={Wallet}
              type="balance"
            />
            <SummaryCard
              title={periodLabel ? t('transactions.income') : t('transactions.total_income')}
              value={formatCurrency(displayedIncome)}
              icon={TrendingUp}
              type="income"
            />
            <SummaryCard
              title={periodLabel ? t('transactions.net_flow') : t('transactions.total_net_flow')}
              value={formatCurrency(netBalance)}
              icon={DollarSign}
              type={netBalance >= 0 ? 'income' : 'expense'}
            />
          </div>

          <main className='dashboard-main'>
            <FilterControls
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              showFilters={showFilters} setShowFilters={setShowFilters}
              filterCategory={filterCategory} setFilterCategory={setFilterCategory}
              filterType={filterType} setFilterType={setFilterType}
              filterTime={filterTime} setFilterTime={setFilterTime}
              filterMin={filterMin} setFilterMin={setFilterMin}
              filterMax={filterMax} setFilterMax={setFilterMax}
              categories={categories} expenseTypes={expenseTypes}
              onAddNew={() => setShowForm(true)}
              onAddAi={() => setShowAiMenu(true)}
            />

            {showForm && (
              <ExpenseModal
                userId={userId} categories={categories} expenseTypes={expenseTypes}
                onClose={() => setShowForm(false)} onExpenseAdded={() => fetchExpenses(userId)}
              />
            )}
            {showAiMenu && (
              <AiExpenseModal
                userId={userId} categories={categories} expenseTypes={expenseTypes}
                onClose={() => setShowAiMenu(false)} onExpenseAdded={() => fetchExpenses(userId)}
              />
            )}
            {editingExpense && (
              <EditExpenseModal
                expense={editingExpense}
                categories={categories}
                expenseTypes={expenseTypes}
                onClose={() => setEditingExpense(null)}
                onSave={handleUpdateExpense}
                onDelete={handleDeleteExpense}
              />
            )}

            <ExpenseTable expenses={filteredExpenses} totalCount={expenses.length} onEditClick={setEditingExpense} />
          </main>
        </div>
      </div>
    </div>
  );
}
