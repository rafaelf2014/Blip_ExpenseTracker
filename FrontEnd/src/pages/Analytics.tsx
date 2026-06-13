import { Sidebar } from '../components/Sidebar';
import { FilterControls } from '../components/FilterControl';
import { SummaryCard } from '../components/SummaryBoxes';
import { Filter, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../styles/Transactions.scss';
import '../styles/Analytics.scss';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { LogoutButton } from '../components/LogoutButton';
import type { CategoryDatum } from '../types';

type ChartTooltipProps = {
    active?: boolean;
    label?: string | number;
    payload?: { value: number; payload: CategoryDatum }[];
};

type TFn = ReturnType<typeof useTranslation>['t'];
type FormatFn = (amount: number | string) => string;

// Tooltips are module-scoped (not redefined each render) and receive the
// translator / formatter / data they need as extra props.
function TrendTooltip({ active, payload, label, t, formatCurrency }: ChartTooltipProps & { t: TFn; formatCurrency: FormatFn }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="custom-tooltip">
            <p className="label">{label}</p>
            <p className="income">{t('categories.income', 'Income')}: {formatCurrency(payload[0].value)}</p>
            <p className="expense">{t('summaryBoxes.totalExpenses', 'Expenses')}: {formatCurrency(payload[1].value)}</p>
        </div>
    );
}

function PieTooltip({ active, payload, t, formatCurrency, categoryData }: ChartTooltipProps & { t: TFn; formatCurrency: FormatFn; categoryData: CategoryDatum[] }) {
    if (!active || !payload?.length) return null;
    const data    = payload[0].payload;
    const total   = categoryData.reduce((sum, item) => sum + item.value, 0);
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
    return (
        <div className="custom-tooltip pie-tooltip">
            <p className="label">{t(`categories.${String(data.name).toLowerCase()}`, { defaultValue: data.name })}</p>
            <p className="pie-value" style={{ color: data.color }}>{formatCurrency(data.value)}</p>
            <p className="pie-percent">{percent}%</p>
        </div>
    );
}

export default function Analytics() {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const {
        categoryData, trendData, stats,
        categories, expenseTypes,
        searchTerm, setSearchTerm,
        showFilters, setShowFilters,
        filterCategory, setFilterCategory,
        filterType, setFilterType,
        filterTime, setFilterTime,
        filterMin, setFilterMin,
        filterMax, setFilterMax,
    } = useAnalytics();

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-content-wrapper">
                <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-title">
                        <h2>{t('analytics.title')}</h2>
                        <p>{t('analytics.subtitle')}</p>
                    </div>
                    <div className="header-actions">
                        <button className="analytics-filters-btn" onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={18} />
                            {showFilters ? t('analytics.hide_filters') : t('analytics.show_filters')}
                        </button>
                        <LogoutButton />
                    </div>
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
                    <SummaryCard title={t('analytics.avg_monthly_income')}   value={formatCurrency(stats.avgMonthlyIncome)}   icon={TrendingUp}   type="income"  />
                    <SummaryCard title={t('analytics.avg_monthly_expenses')} value={formatCurrency(stats.avgMonthlyExpense)}  icon={TrendingDown} type="expense" />
                    <SummaryCard title={t('analytics.avg_daily_spend')}      value={formatCurrency(stats.avgDaily)}           icon={DollarSign}   type="balance" />
                    <SummaryCard title={t('analytics.most_spent_category')}  value={t(`categories.${stats.topCategory.toLowerCase()}`, stats.topCategory)} icon={ShoppingCart} type="balance" />
                </div>

                <div className="charts-grid">
                    <div className="chart-card">
                        <h2>{t('analytics.expense_categories')}</h2>
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
                                    <Tooltip content={<PieTooltip t={t} formatCurrency={formatCurrency} categoryData={categoryData} />} />
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
                        <h2>{t('analytics.income_vs_expenses')}</h2>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<TrendTooltip t={t} formatCurrency={formatCurrency} />} />
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
