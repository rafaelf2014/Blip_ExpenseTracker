import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { Wallet, TrendingUp, TrendingDown, Utensils, Car, ShoppingBag, Film, Pill, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import '../styles/Dashboard.scss';
import { SummaryCard } from '../components/SummaryBoxes';
import { initLLM } from '../services/llmService';
import { useCurrency } from '../Context/CurrencyContext';
import type { Expense, RegularTransaction, Budget, BalanceEntry, BudgetUtilEntry, SavingsRateEntry } from '../types';
import { getWeekStart, toLocalDateStr, monthKey, formatDate, pctOrZero, calcIncome } from '../utils/finance';

export default function Dashboard() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const [expenses, setExpenses]                 = useState<Expense[]>([]);
  const [showForm, setShowForm]                 = useState(false);
  const [username, setUsername]                 = useState('');
  const [userId, setUserId]                     = useState('');
  const [categories, setCategories]             = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes]         = useState<string[]>([]);
  const [currentBalance, setCurrentBalance]     = useState(0);
  const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
  const [budgets, setBudgets]                   = useState<Budget[]>([]);
  const [balanceHistory, setBalanceHistory]     = useState<BalanceEntry[]>([]);
  const [budgetUtilHistory, setBudgetUtilHistory]   = useState<BudgetUtilEntry[]>([]);
  const [savingsRateHistory, setSavingsRateHistory] = useState<SavingsRateEntry[]>([]);
  const [chartPeriod, setChartPeriod]           = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedUserId   = localStorage.getItem('userId');
    initLLM().catch(console.error);

    if (!storedUsername || !storedUserId) {
      navigate('/');
      return;
    }

    setUsername(storedUsername);
    setUserId(storedUserId);

    // Load expense-config independently
    fetch('http://localhost:5000/api/expense-config')
      .then(r => r.json())
      .then(data => { setCategories(data.categories); setExpenseTypes(data.expenseTypes); });

    // Load expenses + settings together so we can snapshot derived values once
    Promise.all([
      fetch(`http://localhost:5000/api/expenses/${storedUserId}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/users/${storedUserId}/settings`).then(r => r.json()),
    ]).then(([expenseData, settingsData]: [Expense[], any]) => {
      const balance:     number            = settingsData.currentBalance ?? 0;
      const regularTxns: RegularTransaction[] = settingsData.regularTransactions ?? [];
      const budgetList:  Budget[]          = settingsData.budgets ?? [];
      const balHist:     BalanceEntry[]    = settingsData.balanceHistory ?? [];
      const budUtilHist: BudgetUtilEntry[] = settingsData.budgetUtilHistory ?? [];
      const savRateHist: SavingsRateEntry[]= settingsData.savingsRateHistory ?? [];

      setExpenses(expenseData);
      setCurrentBalance(balance);
      setRegularTransactions(regularTxns);
      setBudgets(budgetList);

      // ── Compute current-month snapshot values ──────────────────────────────
      const now = new Date();
      const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisKey   = monthKey(now);

      const thisMonthExps = expenseData.filter(e => {
        const d = new Date(e.date); return d >= thisStart && d <= now;
      });
      const monthSpentNow = thisMonthExps.reduce((s, e) => s + Number(e.amount), 0);
      const monthIncomeNow = calcIncome(regularTxns, thisStart, now);

      const monthlyBudgets    = budgetList.filter(b => b.period === 'monthly');
      const totalBudgetLimit  = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
      const thisBudgetSpentNow = monthlyBudgets.reduce((s, b) =>
        s + thisMonthExps.filter(e => e.category === b.category).reduce((c, e) => c + Number(e.amount), 0), 0);

      const budgetUtil = totalBudgetLimit > 0
        ? Math.round(thisBudgetSpentNow / totalBudgetLimit * 100)
        : 0;
      const savRate = monthIncomeNow > 0
        ? Math.round((monthIncomeNow - monthSpentNow) / monthIncomeNow * 100)
        : 0;

      // Upsert this month's entry in each history array
      const newBalHist     = [...balHist.filter(h => h.month !== thisKey),     { month: thisKey, balance }];
      const newBudUtilHist = [...budUtilHist.filter(h => h.month !== thisKey), { month: thisKey, utilization: budgetUtil }];
      const newSavRateHist = [...savRateHist.filter(h => h.month !== thisKey), { month: thisKey, rate: savRate }];

      setBalanceHistory(newBalHist);
      setBudgetUtilHistory(newBudUtilHist);
      setSavingsRateHistory(newSavRateHist);

      // Persist all three histories in one request
      fetch(`http://localhost:5000/api/users/${storedUserId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balanceHistory:    newBalHist,
          budgetUtilHistory: newBudUtilHist,
          savingsRateHistory: newSavRateHist,
        }),
      }).catch(console.error);
    }).catch(console.error);
  }, [navigate]);

  const fetchExpenses = async (id: string) => {
    const res = await fetch(`http://localhost:5000/api/expenses/${id}`);
    if (res.ok) setExpenses(await res.json());
  };

  const today = new Date();

  // ── Month boundaries ────────────────────────────────────────────────────────
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 0);

  // ── Expense buckets ─────────────────────────────────────────────────────────
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date); return d >= thisMonthStart && d <= today;
  });

  const monthSpent  = thisMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthIncome = calcIncome(regularTransactions, thisMonthStart, today);

  const lastMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date); return d >= lastMonthStart && d <= lastMonthEnd;
  });
  const lastMonthSpent  = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const lastMonthIncome = calcIncome(regularTransactions, lastMonthStart, lastMonthEnd);

  // ── Summary card change % (always shown; "0" when no prior data) ───────────
  const lastMonthKey = monthKey(lastMonthStart);

  const lastBalEntry   = balanceHistory.find(h => h.month === lastMonthKey);
  const balanceChange  = pctOrZero(currentBalance, lastBalEntry?.balance);
  const balancePositive = lastBalEntry != null ? currentBalance >= lastBalEntry.balance : true;

  const incomeChange   = pctOrZero(monthIncome, lastMonthIncome || null);
  const incomePositive = monthIncome >= lastMonthIncome;

  const spentChange    = pctOrZero(monthSpent, lastMonthSpent || null);
  const spentPositive  = monthSpent <= lastMonthSpent; // lower spend = good

  // ── Chart data ──────────────────────────────────────────────────────────────
  // Use local date strings for all comparisons — avoids UTC-offset edge cases near midnight
  const todayStr    = toLocalDateStr(today);
  const weekStartStr = toLocalDateStr(getWeekStart(today));

  const chartData = (() => {
    if (chartPeriod === 'week') {
      const data = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(n => ({ name: n, value: 0 }));
      expenses.forEach(exp => {
        const d = new Date(exp.date);
        const s = toLocalDateStr(d);
        if (s >= weekStartStr && s <= todayStr) data[(d.getDay() + 6) % 7].value += Number(exp.amount);
      });
      return data;
    }
    if (chartPeriod === 'month') {
      const data = ['Week 1','Week 2','Week 3','Week 4','Week 5'].map(n => ({ name: n, value: 0 }));
      expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
          data[Math.min(Math.floor((d.getDate() - 1) / 7), 4)].value += Number(exp.amount);
      });
      return data;
    }
    const data = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(n => ({ name: n, value: 0 }));
    expenses.forEach(exp => {
      const d = new Date(exp.date);
      if (d.getFullYear() === today.getFullYear()) data[d.getMonth()].value += Number(exp.amount);
    });
    return data;
  })();

  const highlightIndex =
    chartPeriod === 'week'  ? (today.getDay() + 6) % 7 :
    chartPeriod === 'month' ? Math.min(Math.floor((today.getDate() - 1) / 7), 4) :
    today.getMonth();

  // ── Quick Stats (current month) ─────────────────────────────────────────────
  const daysElapsed       = Math.max(1, today.getDate());
  const lastMonthDays     = lastMonthEnd.getDate();

  const avgDailySpend     = monthSpent / daysElapsed;
  const lastAvgDailySpend = lastMonthSpent / lastMonthDays;
  const avgDailyChange    = pctOrZero(avgDailySpend, lastMonthSpent > 0 ? lastAvgDailySpend : null);

  const largestExpense     = thisMonthExpenses.length > 0 ? Math.max(...thisMonthExpenses.map(e => Number(e.amount))) : 0;
  const lastLargestExpense = lastMonthExpenses.length > 0 ? Math.max(...lastMonthExpenses.map(e => Number(e.amount))) : null;
  const largestChange      = pctOrZero(largestExpense, lastLargestExpense);

  // Budget utilization from stored history for comparison
  const monthlyBudgets    = budgets.filter(b => b.period === 'monthly');
  const totalBudgetLimit  = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
  const thisBudgetSpent   = monthlyBudgets.reduce((s, b) =>
    s + thisMonthExpenses.filter(e => e.category === b.category).reduce((c, e) => c + Number(e.amount), 0), 0);

  const budgetUtilization = totalBudgetLimit > 0 ? Math.round(thisBudgetSpent / totalBudgetLimit * 100) : null;
  const lastBudUtilEntry  = budgetUtilHistory.find(h => h.month === lastMonthKey);
  const budgetUtilChange  = budgetUtilization !== null
    ? pctOrZero(budgetUtilization, lastBudUtilEntry?.utilization ?? null)
    : null;

  const savingsRate      = monthIncome > 0 ? Math.round((monthIncome - monthSpent) / monthIncome * 100) : null;
  const lastSavEntry     = savingsRateHistory.find(h => h.month === lastMonthKey);
  const savingsRateChange = savingsRate !== null
    ? pctOrZero(savingsRate, lastSavEntry?.rate ?? null)
    : null;

  // ── Recent Transactions ─────────────────────────────────────────────────────
  const recentTransactions = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food'))                                return <Utensils size={18} />;
    if (cat.includes('transport'))                           return <Car size={18} />;
    if (cat.includes('clothes') || cat.includes('shopping')) return <ShoppingBag size={18} />;
    if (cat.includes('entertainment'))                       return <Film size={18} />;
    if (cat.includes('health'))                              return <Pill size={18} />;
    return <Receipt size={18} />;
  };

  // Always renders a pill; "0" → neutral green or red depending on higherIsBad
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
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">

          <header className="dashboard-header">
            <div className="header-title">
              <h2>Dashboard</h2>
              <p>Welcome back, <strong>{username}</strong>! Here's your financial overview.</p>
            </div>
            <div className="header-actions">
              <button className="add-expense-btn" onClick={() => setShowForm(true)}>+ Add Expense</button>
            </div>
          </header>

          <main className="dashboard-main">

            {/* Summary Cards */}
            <div className="summary-boxes-container">
              <SummaryCard
                title="Total Balance"
                value={formatCurrency(currentBalance)}
                change={`${Math.abs(Number(balanceChange))}%`}
                isPositive={balancePositive}
                icon={Wallet}
                type="balance"
              />
              <SummaryCard
                title="Monthly Income"
                value={formatCurrency(monthIncome)}
                change={`${Math.abs(Number(incomeChange))}%`}
                isPositive={incomePositive}
                icon={TrendingUp}
                type="income"
              />
              <SummaryCard
                title="Monthly Expenses"
                value={formatCurrency(monthSpent)}
                change={`${Math.abs(Number(spentChange))}%`}
                isPositive={spentPositive}
                icon={TrendingDown}
                type="expense"
              />
            </div>

            {/* Chart + Quick Stats */}
            <section className="main-stats-grid">
              <div className="chart-box">
                <div className="box-header">
                  <div>
                    <h3>{chartPeriod === 'week' ? 'Weekly' : chartPeriod === 'month' ? 'Monthly' : 'Yearly'} Expenses</h3>
                    <small>{chartPeriod === 'week' ? 'Last 7 days' : chartPeriod === 'month' ? 'This month' : 'This year'}</small>
                  </div>
                  <div className="toggle-group">
                    <button className={chartPeriod === 'week'  ? 'active' : ''} onClick={() => setChartPeriod('week')}>Week</button>
                    <button className={chartPeriod === 'month' ? 'active' : ''} onClick={() => setChartPeriod('month')}>Month</button>
                    <button className={chartPeriod === 'year'  ? 'active' : ''} onClick={() => setChartPeriod('year')}>Year</button>
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
                        formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Spent']}
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
                <h3>Quick Stats</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <div className="stat-info">
                      <span>Avg. Daily Spend</span>
                      <strong>{formatCurrency(avgDailySpend)}</strong>
                    </div>
                    <StatPill change={avgDailyChange} higherIsBad />
                  </div>

                  <div className="stat-item">
                    <div className="stat-info">
                      <span>Largest Expense</span>
                      <strong>{formatCurrency(largestExpense)}</strong>
                    </div>
                    <StatPill change={largestChange} higherIsBad />
                  </div>

                  {budgetUtilization !== null && budgetUtilChange !== null && (
                    <div className="stat-item">
                      <div className="stat-info">
                        <span>Budget Utilization</span>
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

            {/* Recent Transactions */}
            <section className="recent-box">
              <div className="box-header">
                <h3>Recent Transactions</h3>
              </div>
              <div className="transactions-mini-list">
                {recentTransactions.length === 0 ? (
                  <p className="empty-state">No transactions yet. Add your first expense!</p>
                ) : recentTransactions.map(exp => (
                  <div key={exp.id} className="mini-item">
                    <div className="item-main">
                      <div className="icon-circle">{getCategoryIcon(exp.category)}</div>
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
