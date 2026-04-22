import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { FilterControls } from '../components/FilterControl';
import { Filter, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../styles/Analytics.scss';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../Context/CurrencyContext';
import { useEffect } from 'react';

type Expense = {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: string;
    date: string;
};

export default function Analytics() {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();

    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);

    // State for summary statistics
    const [stats, setStats] = useState({
        avgIncome: 0,
        avgExpense: 0,
        avgDaily: 0,
        topCategory: 'N/A'
    });

    const [rawExpenses, setRawExpenses] = useState<Expense[]>([]); // Guarda os dados vindos da DB
    const [categories, setCategories] = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<string[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTime, setFilterTime] = useState('');
    const [filterMin, setFilterMin] = useState('');
    const [filterMax, setFilterMax] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Upload of analytics data on component mount
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            fetch(`http://localhost:5000/api/expenses/${storedUserId}`)
                .then(res => res.json())
                .then(data => {
                    setRawExpenses(data);
                })
                .catch(err => console.error("Erro a carregar dados:", err));
        }
        fetch('http://localhost:5000/api/expense-config')
            .then(res => res.json())
            .then(data => {
                setCategories(data.categories);
                setExpenseTypes(data.expenseTypes);
            });
    }, []);

    useEffect(() => {
        const filteredExpenses = rawExpenses.filter((expense) => {
            const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' || expense.category === filterCategory;
            const matchesType = filterType === '' || expense.type === filterType;

            const amount = Number(expense.amount);
            const matchesMin = filterMin === '' || amount >= Number(filterMin);
            const matchesMax = filterMax === '' || amount <= Number(filterMax);

            let matchesTime = true;
            if (filterTime !== '') {
                const expenseDate = new Date(expense.date);
                const today = new Date();
                if (filterTime === 'week') {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(today.getDate() - 7);
                    matchesTime = expenseDate >= oneWeekAgo;
                } else if (filterTime === 'month') {
                    matchesTime = expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
                } else if (filterTime === 'year') {
                    matchesTime = expenseDate.getFullYear() === today.getFullYear();
                }
            }
            return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && matchesTime;
        });

        // Whenever filters change, recalculate the charts with the new list!
        processAnalyticsData(filteredExpenses);

    }, [rawExpenses, searchTerm, filterCategory, filterType, filterTime, filterMin, filterMax]);

    const processAnalyticsData = (expenses: Expense[]) => {
        const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#64748b'];

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals: Record<string, number> = {};
        const monthlyData: Record<string, { income: number, expenses: number }> = {};

        expenses.forEach(exp => {
            const amount = Number(exp.amount);
            const date = new Date(exp.date);
            const month = date.toLocaleString('default', { month: 'short' }); // Ex: 'Jan', 'Feb'

            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expenses: 0 };
            }

            const isIncome = exp.category.toLowerCase().includes('income') || exp.category.toLowerCase().includes('rendimento');

            if (isIncome) {
                totalIncome += amount;
                monthlyData[month].income += amount;
            } else {
                totalExpense += amount;
                monthlyData[month].expenses += amount;

                categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
            }
        });

        // Building the data for the Pie Chart (Categories)
        const newCategoryData = Object.keys(categoryTotals).map((key, index) => ({
            name: key,
            value: Number(categoryTotals[key].toFixed(2)),
            color: COLORS[index % COLORS.length]
        }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        // Building the data for the Line Chart (Trends)
        const newTrendData = Object.keys(monthlyData).map(month => ({
            month: month,
            income: Number(monthlyData[month].income.toFixed(2)),
            expenses: Number(monthlyData[month].expenses.toFixed(2))
        }));

        // Calculating summary statistics
        const uniqueMonths = Object.keys(monthlyData).length || 1; // Evitar divisão por zero
        const topCat = newCategoryData.length > 0 ? newCategoryData[0].name : 'N/A';

        // Spending mean per day (30 days approximation)
        const avgDaily = totalExpense / (uniqueMonths * 30);

        setCategoryData(newCategoryData);
        setTrendData(newTrendData);
        setStats({
            avgIncome: totalIncome / uniqueMonths,
            avgExpense: totalExpense / uniqueMonths,
            avgDaily: avgDaily,
            topCategory: topCat
        });
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
                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
                        {percent}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analytics-layout">
            <Sidebar />

            <main className="analytics-content">
                <header className="analytics-header">
                    <div>
                        <h1>Analytics</h1>
                        <p>Deep insights into your financial data</p>
                    </div>
                    <button
                        className="header-filters-btn"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                </header>
                <div className="analytics-filters-wrapper" style={{ display: showFilters ? 'block' : 'none' }}>
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
                        hideAddButton={true}
                        hideSearch={true}
                    />
                </div>


                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="card-header">
                            <span>Avg Monthly Income</span>
                            <TrendingUp size={20} color="#10b981" />
                        </div>
                        <h3>{formatCurrency(stats.avgIncome)}</h3>
                    </div>
                    <div className="summary-card">
                        <div className="card-header">
                            <span>Avg Monthly Expenses</span>
                            <TrendingDown size={20} color="#ef4444" />
                        </div>
                        <h3 className="expense">{formatCurrency(stats.avgExpense)}</h3>
                    </div>
                    <div className="summary-card">
                        <div className="card-header">
                            <span>Avg Daily Spend</span>
                            <DollarSign size={20} color="#06b6d4" />
                        </div>
                        <h3 className="info">{formatCurrency(stats.avgDaily)}</h3>
                    </div>
                    <div className="summary-card">
                        <div className="card-header">
                            <span>Most Spent Category</span>
                            <ShoppingCart size={20} color="#f59e0b" />
                        </div>
                        <h3 className="warning">{t(`categories.${stats.topCategory.toLowerCase()}`, stats.topCategory)}</h3>
                    </div>
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
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={85}
                                        outerRadius={115}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="#151E32"
                                        strokeWidth={2}
                                        minAngle={15}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                filter="url(#pie-shadow)"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieCustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="custom-legend-grid">
                            {categoryData.map((item) => {
                                const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={true} horizontal={true} />
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

                {/* Top Spending Categories */}
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
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${percentage}%`, backgroundColor: category.color }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}