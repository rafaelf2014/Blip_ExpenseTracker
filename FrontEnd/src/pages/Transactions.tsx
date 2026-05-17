import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ExpenseTable } from '../components/ExpenseTable';
import { FilterControls } from '../components/FilterControl';
import { SummaryCard } from '../components/SummaryBoxes';
import '../styles/Transactions.scss';
import { AiExpenseBar } from '../components/AiExpenseBar';
import { Receipt, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { useCurrency } from '../Context/CurrencyContext';
import { useTransactions } from '../hooks/useTransactions';
import { AiChatBot } from '../components/AiChatBot';
import { useTranslation } from 'react-i18next';

export default function Transactions() {
  const { formatCurrency } = useCurrency();
  const {
    username, userId,
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
    handleLogout,
    handleUpdateExpense,
    handleDeleteExpense,
    periodLabel, displayedSpent, displayedIncome, netBalance,
  } = useTransactions();
  const { t } = useTranslation();


  return (
    <div className="dashboard-layout">
      <Sidebar />
      <AiChatBot userId={userId} categories={categories} expenseTypes={expenseTypes} expenses={expenses} onExpenseAdded={() => fetchExpenses(userId)} />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div className="header-title">
              <h2>{t('header_transactions.title')}</h2>
              <p>{t('header_transactions.subtitle')}</p>
            </div>
            <div className='header-user-section'>
              <span className='welcome-text'>{t('header_transactions.welcome')}{username}!</span>
              <button onClick={handleLogout} className='logout-btn'>{t('header_transactions.logout')}</button>
            </div>
          </header>

          <div className="summary-boxes-container">
            <SummaryCard
              title={t('summaryBoxes.totalTransactions')}
              value={`${filteredExpenses.length}`}
              icon={Receipt}
              type="expense"
            />
            <SummaryCard
              title={t('summaryBoxes.totalExpenses')}
              value={formatCurrency(displayedSpent)}
              icon={Wallet}
              type="balance"
            />
            <SummaryCard
              title={t('summaryBoxes.totalIncome')}
              value={formatCurrency(displayedIncome)}
              icon={TrendingUp}
              type="income"
            />
            <SummaryCard
              title={t('summaryBoxes.netBalance')}
              value={formatCurrency(netBalance)}
              icon={DollarSign}
              type={netBalance >= 0 ? 'income' : 'expense'}
            />
          </div>

          <main className='dashboard-main'>
            <AiExpenseBar
              userId={userId}
              categories={categories}
              expenseTypes={expenseTypes}
              onExpenseAdded={() => fetchExpenses(userId)}
            />

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
            />

            {showForm && (
              <ExpenseModal
                userId={userId} categories={categories} expenseTypes={expenseTypes} expenses={expenses}
                onClose={() => setShowForm(false)} onExpenseAdded={() => fetchExpenses(userId)}
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

            <ExpenseTable expenses={filteredExpenses} onEditClick={setEditingExpense} />
          </main>
        </div>
      </div>
    </div>
  );
}
