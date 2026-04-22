import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { FilterControls } from '../components/FilterControl';
import { SummaryCard } from '../components/SummaryBoxes';
import { Filter, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../styles/Transactions.scss';
import '../styles/Analytics.scss';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../Context/CurrencyContext';
import type { Expense, RegularTransaction } from '../types';
import { getWeekStart, toLocalDateStr, calcIncome } from '../utils/finance';

export default function Analytics() {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();

    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);

    const [stats, setStats] = useState({
        avgMonthlyIncome: 0,
        avgMonthlyExpense: 0,
        avgDaily: 0,
        topCategory: 'N/A'
    });

    const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<string[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTime, setFilterTime] = useState('');
    const [filterMin, setFilterMin] = useState('');
    const [filterMax, setFilterMax] = useState('');

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            fetch(`http://localhost:5000/api/expenses/${storedUserId}`)
                .then(res => res.json())
                .then(data => setRawExpenses(data))
                .catch(err => console.error('Error loading analytics data:', err));
            fetch(`http://localhost:5000/api/users/${storedUserId}/settings`)
                .then(res => res.json())
                .then(data => setRegularTransactions(data.regularTransactions ?? []))
                .catch(console.error);
        }
        fetch('http://localhost:5000/api/expense-config')
            .then(res => res.json())
            .then(data => {
                setCategories(data.categories);
                setExpenseTypes(data.expenseTypes);
            });
    }, []);

    useEffect(() => {
        const today = new Date();
        const todayStr = toLocalDateStr(today);
        const weekStartStr = toLocalDateStr(getWeekStart(today));

        const filtered = rawExpenses.filter((expense) => {
            const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' || expense.category === filterCategory;
            const matchesType = filterType === '' || expense.type === filterType;
            const amount = Number(expense.amount);
            const matchesMin = filterMin === '' || amount >= Number(filterMin);
            const matchesMax = filterMax === '' || amount <= Number(filterMax);

            let matchesTime = true;
            if (filterTime !== '') {
                const expStr = toLocalDateStr(new Date(expense.date));
                if (filterTime === 'week') {
                    matchesTime = expStr >= weekStartStr && expStr <= todayStr;
                } else if (filterTime === 'month') {
                    const d = new Date(expense.date);
                    matchesTime = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                } else if (filterTime === 'year') {
                    matchesTime = new Date(expense.date).getFullYear() === today.getFullYear();
                }
            }
            return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && matchesTime;
        });

        // Compute income for the active period using regularTransactions
        let periodStart: Date;
        if (filterTime === 'week')       periodStart = getWeekStart(today);
        else if (filterTime === 'month') periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        else if (filterTime === 'year')  periodStart = new Date(today.getFullYear(), 0, 1);
        else {
            const earliest = rawExpenses.reduce((min, e) => Math.min(min, new Date(e.date).getTime()), Infinity);
            periodStart = isFinite(earliest) ? new Date(earliest) : new Date(0);
        }
        const totalIncome = calcIncome(regularTransactions, periodStart, today);

        processAnalyticsData(filtered, filterTime, totalIncome);
    }, [rawExpenses, regularTransactions, searchTerm, filterCategory, filterType, filterTime, filterMin, filterMax]);

    const processAnalyticsData = (expenses: Expense[], activeFilter: string, totalIncome: number) => {
        const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#64748b'];

        let totalExpense = 0;
        const categoryTotals: Record<string, number> = {};
        const monthlyData: Record<string, { income: number; expenses: number }> = {};

        expenses.forEach(exp => {
            const amount = Number(exp.amount);
            const date = new Date(exp.date);
            const month = date.toLocaleString('default', { month: 'short' });

            if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };

            totalExpense += amount;
            monthlyData[month].expenses += amount;
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
        });

        const newCategoryData = Object.keys(categoryTotals)
            .map((key, index) => ({ name: key, value: Number(categoryTotals[key].toFixed(2)), color: COLORS[index % COLORS.length] }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const newTrendData = Object.keys(monthlyData).map(month => ({
            month,
            income: Number(monthlyData[month].income.toFixed(2)),
            expenses: Number(monthlyData[month].expenses.toFixed(2))
        }));

        const topCat = newCategoryData.length > 0 ? newCategoryData[0].name : 'N/A';

        // ── Period metrics ────────────────────────────────────────────────────
        const today = new Date();
        let numDays: number;
        let numMonths: number;

        if (activeFilter === 'week') {
            numDays = 7;
            numMonths = 1; // handled via * 4 below
        } else if (activeFilter === 'month') {
            numDays = today.getDate(); // days elapsed in current month
            numMonths = 1;
        } else if (activeFilter === 'year') {
            const yearStart = new Date(today.getFullYear(), 0, 1);
            numDays = Math.ceil((today.getTime() - yearStart.getTime()) / 86400000) + 1;
            numMonths = today.getMonth() + 1; // months elapsed this year
        } else {
            // All time: span from earliest expense to today
            if (expenses.length > 0) {
                const earliest = expenses.reduce((min, e) => {
                    const t = new Date(e.date).getTime();
                    return t < min ? t : min;
                }, Infinity);
                numDays = Math.ceil((today.getTime() - earliest) / 86400000) + 1;
            } else {
                numDays = 1;
            }
            numMonths = Object.keys(monthlyData).length || 1;
        }

        const avgDaily = totalExpense / Math.max(numDays, 1);
        // For weekly filter, extrapolate to monthly (week * 4); otherwise divide by months elapsed
        const avgMonthlyExpense = activeFilter === 'week' ? totalExpense * 4 : totalExpense / Math.max(numMonths, 1);
        const avgMonthlyIncome  = activeFilter === 'week' ? totalIncome  * 4 : totalIncome  / Math.max(numMonths, 1);

        setCategoryData(newCategoryData);
        setTrendData(newTrendData);
        setStats({ avgMonthlyIncome, avgMonthlyExpense, avgDaily, topCategory: topCat });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    <p className="income">{t('categories.income', 'Income')}: {formatCurrency(payload[0].value)}</p>
                    <p className="expense">{t('summaryBoxes.totalExpenses', 'Expenses')}: {formatCurrency(payload[1].value)}</p>
                </div>
            );
        }
        return null;
    };

    const PieCustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const total = categoryData.reduce((sum, item) => sum + item.value, 0);
            const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
            return (
                <div className="custom-tooltip" style={{ minWidth: '130px' }}>
                    <p className="label" style={{ color: '#F8FAFC', marginBottom: '4px' }}>
                        {t(`categories.${String(data.name).toLowerCase()}`, { defaultValue: data.name })}
                    </p>
                    <p style={{ color: data.color, fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                        {formatCurrency(data.value)}
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>{percent}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-content-wrapper">
                <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-title">
                        <h2>Analytics</h2>
                        <p>Deep insights into your financial data</p>
                    </div>
                    <button className="analytics-filters-btn" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={18} />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </header>

                <div className="dashboard-main">

                {showFilters && (
                    <FilterControls
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        showFilters={showFilters} setShowFilters={setShowFilters}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        filterType={filterType} setFilterType={setFilterType}
                        filterTime={filterTime} setFilterTime={setFilterTime}
                        filterMin={filterMin} setFilterMin={setFilterMin}
                        filterMax={filterMax} setFilterMax={setFilterMax}
                        categories={categories} expenseTypes={expenseTypes}
                        onAddNew={() => {}}
                        hideAddButton={true}
                        hideSearch={true}
                    />
                )}

                <div className="summary-boxes-container">
                    <SummaryCard title="Avg Monthly Income"   value={formatCurrency(stats.avgMonthlyIncome)}   icon={TrendingUp}   type="income"  />
                    <SummaryCard title="Avg Monthly Expenses" value={formatCurrency(stats.avgMonthlyExpense)}  icon={TrendingDown} type="expense" />
                    <SummaryCard title="Avg Daily Spend"      value={formatCurrency(stats.avgDaily)}           icon={DollarSign}   type="balance" />
                    <SummaryCard title="Most Spent Category"  value={t(`categories.${stats.topCategory.toLowerCase()}`, stats.topCategory)} icon={ShoppingCart} type="balance" />
                </div>

                <div className="charts-grid">
                    <div className="chart-card">
                        <h2>Expense Categories</h2>
                        <div className="chart-wrapper">
                            <svg width="0" height="0">
                                <defs>
                                    <filter id="pie-shadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
                                    </filter>
                                </defs>
                            </svg>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%" cy="50%"
                                        innerRadius={85} outerRadius={115}
                                        paddingAngle={4} dataKey="value"
                                        stroke="rgb(255, 255, 255)" strokeWidth={1.2} minAngle={3}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} filter="url(#pie-shadow)" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieCustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="custom-legend-grid">
                            {categoryData.map((item) => {
                                const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.00';
                                return (
                                    <div key={item.name} className="legend-item">
                                        <div className="legend-color-wrapper">
                                            <span className="dot" style={{ backgroundColor: item.color }}></span>
                                            <span className="name">
                                                {t(`categories.${String(item.name).toLowerCase()}`, { defaultValue: item.name })}
                                            </span>
                                        </div>
                                        <span className="value">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="chart-card">
                        <h2>Income vs Expenses Trend</h2>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="income" name={t('categories.income', 'Income')} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="expenses" name={t('summaryBoxes.totalExpenses', 'Expenses')} stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="chart-card top-categories-card">
                    <h2>{t('analytics.topSpendingCategories', 'Top Spending Categories')}</h2>
                    <div className="categories-list">
                        {categoryData.map((category, index) => {
                            const totalCategorySpend = categoryData.reduce((sum, item) => sum + item.value, 0);
                            const percentage = totalCategorySpend > 0 ? ((category.value / totalCategorySpend) * 100).toFixed(1) : '0.0';
                            return (
                                <div key={category.name} className="category-row">
                                    <div className="category-info">
                                        <span className="rank">#{index + 1}</span>
                                        <span className="name">
                                            {t(`categories.${String(category.name).toLowerCase()}`, { defaultValue: category.name })}
                                        </span>
                                        <span className="amount-group">
                                            <span className="amount">{formatCurrency(category.value)}</span>
                                            <span className="percentage">({percentage}%)</span>
                                        </span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${percentage}%`, backgroundColor: category.color }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </div>
                </div>
            </div>
        </div>
    );
}
