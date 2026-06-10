import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import '../styles/Dashboard.scss';
import { SummaryCard } from '../components/SummaryBoxes';
import { useCurrency } from '../Context/CurrencyContext';
import { useDate } from '../Context/DateContext';
import { useDashboard } from '../hooks/useDashboard';
import { getCategoryIcon } from '../utils/iconMapping';

function StatPill({ change, higherIsBad = false }: { change: string; higherIsBad?: boolean }) {
  const val = Number(change);
  const positive = higherIsBad ? val <= 0 : val >= 0;
  return (
    <span className={`stat-pill ${positive ? 'positive' : 'negative'}`}>
      {val > 0 ? '+' : ''}{change}%
    </span>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDate();
  const {
    showForm, setShowForm, username, userId,
    categories, expenseTypes, currentBalance,
    chartPeriod, setChartPeriod,
    fetchExpenses,
    chartData, highlightIndex,
    recentTransactions,
    summary,
    quickStats,
  } = useDashboard();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">

          <header className="dashboard-header">
            <div className="header-title">
              <h2>{t('dashboard.title')}</h2>
              <p>{t('dashboard.welcome', { username })}</p>
            </div>
            <div className="header-actions">
              <button className="add-expense-btn" onClick={() => setShowForm(true)}>{t('dashboard.add_expense')}</button>
            </div>
          </header>

          <main className="dashboard-main">

            <div className="summary-boxes-container">
              <SummaryCard
                title={t('dashboard.total_balance')}
                value={formatCurrency(currentBalance)}
                change={`${Math.abs(Number(summary.balanceChange))}%`}
                isPositive={summary.balancePositive}
                icon={Wallet}
                type="balance"
              />
              <SummaryCard
                title={t('dashboard.monthly_income')}
                value={formatCurrency(summary.monthIncome)}
                change={`${Math.abs(Number(summary.incomeChange))}%`}
                isPositive={summary.incomePositive}
                icon={TrendingUp}
                type="income"
              />
              <SummaryCard
                title={t('dashboard.monthly_expenses')}
                value={formatCurrency(summary.monthSpent)}
                change={`${Math.abs(Number(summary.spentChange))}%`}
                isPositive={summary.spentPositive}
                icon={TrendingDown}
                type="expense"
              />
            </div>

            <section className="main-stats-grid">
              <div className="chart-box">
                <div className="box-header">
                  <div>
                    <h3>{chartPeriod === 'week' ? t('dashboard.weekly_expenses') : chartPeriod === 'month' ? t('dashboard.monthly_expenses_chart') : t('dashboard.yearly_expenses')}</h3>
                    <small>{chartPeriod === 'week' ? t('dashboard.range_week') : chartPeriod === 'month' ? t('dashboard.range_month') : t('dashboard.range_year')}</small>
                  </div>
                  <div className="toggle-group">
                    <button className={chartPeriod === 'week' ? 'active' : ''} onClick={() => setChartPeriod('week')}>{t('dashboard.toggle_week')}</button>
                    <button className={chartPeriod === 'month' ? 'active' : ''} onClick={() => setChartPeriod('month')}>{t('dashboard.toggle_month')}</button>
                    <button className={chartPeriod === 'year' ? 'active' : ''} onClick={() => setChartPeriod('year')}>{t('dashboard.toggle_year')}</button>
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
                        formatter={(value) => [formatCurrency(Number(value ?? 0)), t('dashboard.tooltip_spent')]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={entry.name} fill={i === highlightIndex ? '#06B6D4' : '#334155'} />
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
                      <span>{t('dashboard.avg_daily_spend')}</span>
                      <strong>{formatCurrency(quickStats.avgDailySpend)}</strong>
                    </div>
                    <StatPill change={quickStats.avgDailyChange} higherIsBad />
                  </div>

                  <div className="stat-item">
                    <div className="stat-info">
                      <span>{t('dashboard.largest_expense')}</span>
                      <strong>{formatCurrency(quickStats.largestExpense)}</strong>
                    </div>
                    <StatPill change={quickStats.largestChange} higherIsBad />
                  </div>

                  {quickStats.budgetUtilization !== null && quickStats.budgetUtilChange !== null && (
                    <div className="stat-item">
                      <div className="stat-info">
                        <span>{t('dashboard.budget_utilization')}</span>
                        <strong className={quickStats.budgetUtilization >= 100 ? 'stat-over' : undefined}>
                          {quickStats.budgetUtilization}%
                        </strong>
                      </div>
                      <StatPill change={quickStats.budgetUtilChange} higherIsBad />
                    </div>
                  )}

                  {quickStats.savingsRate !== null && quickStats.savingsRateChange !== null && (
                    <div className="stat-item">
                      <div className="stat-info">
                        <span>{t('dashboard.savings_rate')}</span>
                        <strong>{quickStats.savingsRate}%</strong>
                      </div>
                      <StatPill change={quickStats.savingsRateChange} higherIsBad={false} />
                    </div>
                  )}

                  {quickStats.budgetUtilization === null && quickStats.savingsRate === null && (
                    <p className="stats-hint">{t('dashboard.stats_hint')}</p>
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
                  <p className="empty-state">{t('dashboard.empty_transactions')}</p>
                ) : recentTransactions.map(exp => (
                  <div key={exp.id} className="mini-item">
                    <div className="item-main">
                      <div className="icon-circle">{getCategoryIcon(exp.category, 18)}</div>
                      <div className="item-details">
                        <strong>{exp.description}</strong>
                        <span>{exp.category}</span>
                      </div>
                    </div>
                    <div className="item-price">
                      <strong className="neg">-{formatCurrency(Number(exp.amount))}</strong>
                      <span>{formatDate(exp.date)}</span>
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
          onClose={() => setShowForm(false)}
          onExpenseAdded={() => fetchExpenses(userId)}
        />
      )}
    </div>
  );
}
