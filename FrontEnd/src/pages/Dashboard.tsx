import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import '../styles/Dashboard.scss';
import { SummaryCard } from '../components/SummaryBoxes';
import { useCurrency } from '../Context/CurrencyContext';
import { useDashboard } from '../hooks/useDashboard';
import { formatDate } from '../utils/finance';
import { getCategoryIcon } from '../utils/iconMapping';
import { AiChatBot } from '../components/AiChatBot';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const {
    showForm, setShowForm, username, userId,
    categories, expenseTypes, currentBalance,
    expenses,
    chartPeriod, setChartPeriod,
    fetchExpenses,
    monthSpent, monthIncome,
    balanceChange, balancePositive,
    incomeChange, incomePositive,
    spentChange, spentPositive,
    chartData, highlightIndex,
    avgDailySpend, avgDailyChange,
    largestExpense, largestChange,
    budgetUtilization, budgetUtilChange,
    savingsRate, savingsRateChange,
    recentTransactions,
  } = useDashboard();

  const StatPill = ({ change, higherIsBad = false }: { change: string; higherIsBad?: boolean }) => {
    const val = Number(change);
    const positive = higherIsBad ? val <= 0 : val >= 0;
    return (
      <span className={`stat-pill ${positive ? 'positive' : 'negative'}`}>
        {val > 0 ? '+' : ''}{change}%
      </span>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <AiChatBot userId={userId} categories={categories} expenseTypes={expenseTypes} expenses={expenses} onExpenseAdded={() => fetchExpenses(userId)} />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">

          <header className="dashboard-header">
            <div className="header-title">
              <h2>{t('dashboard.title')}</h2>
              <p>{t('dashboard.subtitle', { username })}</p>
            </div>
            <div className="header-actions">
              <button className="add-expense-btn" onClick={() => setShowForm(true)}>{t('filters.add_expense')}</button>
            </div>
          </header>

          <main className="dashboard-main">

            <div className="summary-boxes-container">
              <SummaryCard
                title={t('dashboard.summary_balance')}
                value={formatCurrency(currentBalance)}
                change={`${Math.abs(Number(balanceChange))}%`}
                isPositive={balancePositive}
                icon={Wallet}
                type="balance"
              />
              <SummaryCard
                title={t('dashboard.summary_income')}
                value={formatCurrency(monthIncome)}
                change={`${Math.abs(Number(incomeChange))}%`}
                isPositive={incomePositive}
                icon={TrendingUp}
                type="income"
              />
              <SummaryCard
                title={t('dashboard.summary_expenses')}
                value={formatCurrency(monthSpent)}
                change={`${Math.abs(Number(spentChange))}%`}
                isPositive={spentPositive}
                icon={TrendingDown}
                type="expense"
              />
            </div>

            <section className="main-stats-grid">
              <div className="chart-box">
                <div className="box-header">
                  <div>
                    <h3>{chartPeriod === 'week' ? t('dashboard.weekly_expenses') : chartPeriod === 'month' ? t('dashboard.monthly_expenses') : t('dashboard.yearly_expenses')}</h3>
                    <small>{chartPeriod === 'week' ? t('dates.last_7_days') : chartPeriod === 'month' ? t('dates.this_month') : t('dates.this_year')}</small>
                  </div>
                  <div className="toggle-group">
                    <button className={chartPeriod === 'week' ? 'active' : ''} onClick={() => setChartPeriod('week')}>{t('dates.week')}</button>
                    <button className={chartPeriod === 'month' ? 'active' : ''} onClick={() => setChartPeriod('month')}>{t('dates.month')}</button>
                    <button className={chartPeriod === 'year' ? 'active' : ''} onClick={() => setChartPeriod('year')}>{t('dates.year')}</button>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} barCategoryGap="35%">
                      <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="4 4" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} width={40} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}
                        itemStyle={{ color: '#ffffff' }}
                        formatter={(value) => [formatCurrency(Number(value ?? 0)), t('dashboard.spent')]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === highlightIndex ? '#06B6D4' : '#334155'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="quick-stats-box">
                <h3>{t('dashboard.quick_stats')}</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <div className="stat-info">
                      <span>{t('dashboard.quick_stats_income')}</span>
                      <strong>{formatCurrency(avgDailySpend)}</strong>
                    </div>
                    <StatPill change={avgDailyChange} higherIsBad />
                  </div>

                  <div className="stat-item">
                    <div className="stat-info">
                      <span>{t('dashboard.quick_stats_expenses')}</span>
                      <strong>{formatCurrency(largestExpense)}</strong>
                    </div>
                    <StatPill change={largestChange} higherIsBad />
                  </div>

                  {budgetUtilization !== null && budgetUtilChange !== null && (
                    <div className="stat-item">
                      <div className="stat-info">
                        <span>{t('dashboard.quick_stats_budget')}</span>
                        <strong className={budgetUtilization >= 100 ? 'stat-over' : undefined}>
                          {budgetUtilization}%
                        </strong>
                      </div>
                      <StatPill change={budgetUtilChange} higherIsBad />
                    </div>
                  )}

                  {savingsRate !== null && savingsRateChange !== null && (
                    <div className="stat-item">
                      <div className="stat-info">
                        <span>Savings Rate</span>
                        <strong>{savingsRate}%</strong>
                      </div>
                      <StatPill change={savingsRateChange} higherIsBad={false} />
                    </div>
                  )}

                  {budgetUtilization === null && savingsRate === null && (
                    <p className="stats-hint">Set budgets and regular income in Settings to unlock more stats.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="recent-box">
              <div className="box-header">
                <h3>{t('dashboard.recent_transactions')}</h3>
              </div>
              <div className="transactions-mini-list">
                {recentTransactions.length === 0 ? (
                  <p className="empty-state">{t('dashboard.no_recent_transactions')}</p>
                ) : recentTransactions.map(exp => (
                  <div key={exp.id} className="mini-item">
                    <div className="item-main">
                      <div className="icon-circle">{getCategoryIcon(exp.category, 18)}</div>
                      <div className="item-details">
                        <strong>{exp.description}</strong>
                        <span>{t(`categories.${exp.category.toLowerCase()}`)}</span>
                      </div>
                    </div>
                    <div className="item-price">
                      <strong className="neg">-{formatCurrency(Number(exp.amount))}</strong>
                      <span>{formatDate(exp.date )}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>

      {showForm && (
        <ExpenseModal
          userId={userId}
          categories={categories}
          expenseTypes={expenseTypes}
          expenses={expenses}
          onClose={() => setShowForm(false)}
          onExpenseAdded={() => fetchExpenses(userId)}
        />
      )}
    </div>
  );
}
