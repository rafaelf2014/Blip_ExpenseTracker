import { Check, Filter, Folder, Layers, Calendar } from "lucide-react";
import "../styles/FilterControl.scss";
import { useCurrency } from '../Context/CurrencyContext';
import { useTranslation } from 'react-i18next';

type FilterControlsProps = {
  searchTerm: string; setSearchTerm: (val: string) => void;
  showFilters: boolean; setShowFilters: (val: boolean) => void;
  filterCategory: string; setFilterCategory: (val: string) => void;
  filterType: string; setFilterType: (val: string) => void;
  filterTime: string; setFilterTime: (val: string) => void;
  filterMin: string; setFilterMin: (val: string) => void;
  filterMax: string; setFilterMax: (val: string) => void;
  categories: string[];
  expenseTypes: string[];
  onAddNew: () => void;
};

export function FilterControls({
  searchTerm, setSearchTerm, showFilters, setShowFilters,
  filterCategory, setFilterCategory, filterType, setFilterType,
  filterTime, setFilterTime, filterMin, setFilterMin,
  filterMax, setFilterMax, categories, expenseTypes, onAddNew
}: FilterControlsProps) {

  const handleClear = () => {
    setFilterCategory(''); setFilterType(''); setFilterTime('');
    setFilterMin(''); setFilterMax(''); setSearchTerm('');
  };

  const { currencySymbol } = useCurrency();
  const { t } = useTranslation();

  return (
    <>
      {/* TOP BAR (Search & Main Actions) */}
      <div className="filter-top-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder={t('filters.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="action-buttons">
          <button
            className={`toggle-filters-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {showFilters ? t('filters.hide_filters') : t('filters.filter')}
          </button>

          <button className="add-expense-btn" onClick={onAddNew}>
            {t('filters.add_expense')}
          </button>
        </div>
      </div>
      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="filter-panel">

          {/* Section: Time Range */}
          <div className="filter-section">
            <h3 className="section-title"><Calendar size={18} /> {t('filters.date_range')}</h3>
            <div className="options-grid">
              <div className={`filter-pill ${filterTime === '' ? 'active' : ''}`} onClick={() => setFilterTime('')}>
                {t('filters.all_time')}
              </div>
              <div className={`filter-pill ${filterTime === 'week' ? 'active' : ''}`} onClick={() => setFilterTime('week')}>
                {t('filters.week')}
              </div>
              <div className={`filter-pill ${filterTime === 'month' ? 'active' : ''}`} onClick={() => setFilterTime('month')}>
                {t('filters.month')}
              </div>
              <div className={`filter-pill ${filterTime === 'year' ? 'active' : ''}`} onClick={() => setFilterTime('year')}>
                {t('filters.year')}
              </div>
            </div>
          </div>

          {/* Section: Categories */}
          <div className="filter-section">
            <h3 className="section-title"><Layers size={18} /> {t('filters.category')}</h3>
            <div className="options-grid">

              <div className={`category-card ${filterCategory === '' ? 'active' : ''}`} onClick={() => setFilterCategory('')}>
                <Check size={14} className="check-icon" />
                <Folder size={28} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>{t('filters.all_categories')}</span>
              </div>

              {categories.map((cat) => (
                <div key={cat} className={`category-card ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>
                  <Check size={14} className="check-icon" />
                  <Folder size={28} />
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{t(`categories.${cat.toLowerCase()}`, cat)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Types */}
          <div className="filter-section">
            <h3 className="section-title"><Layers size={18} /> {t('filters.type')}</h3>
            <div className="options-grid">
              <div className={`filter-pill ${filterType === '' ? 'active' : ''}`} onClick={() => setFilterType('')}>
                {t('filters.all_types')}
              </div>
              {expenseTypes.map((type) => (
                <div key={type} className={`filter-pill ${filterType === type ? 'active' : ''}`} onClick={() => setFilterType(type)}>
                  {t(`types.${(type).toLowerCase()}`, type)}
                </div>
              ))}
            </div>
          </div>

          {/* Footer: Amounts & Action Buttons */}
          <div className="filter-footer">
            <div className="amounts-group">
              <div className="input-group">
                <label>{t('filters.min_amount')} ({currencySymbol})</label>
                <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} placeholder="0" />
              </div>
              <div className="input-group">
                <label>{t('filters.max_amount')} ({currencySymbol})</label>
                <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} placeholder="Any" />
              </div>
            </div>

            <div className="panel-actions">
              <button className="clear-btn" onClick={handleClear}>
                {t('filters.clear')}
              </button>
              <button className="apply-btn" onClick={() => setShowFilters(false)}>
                {t('filters.apply')}
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}