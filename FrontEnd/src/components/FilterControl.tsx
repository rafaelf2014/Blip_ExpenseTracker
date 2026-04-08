import { Check, Filter, Folder, Layers, Calendar } from "lucide-react";
import "../styles/FilterControl.scss";
import { useCurrency } from '../Context/CurrencyContext';

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

  return (
    <>
      {/* TOP BAR (Search & Main Actions) */}
      <div className="filter-top-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search transactions..."
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
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>

          <button className="add-expense-btn" onClick={onAddNew}>
            + Add Expense
          </button>
        </div>
      </div>
      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="filter-panel">

          {/* Section: Time Range */}
          <div className="filter-section">
            <h3 className="section-title"><Calendar size={18} /> Date Range</h3>
            <div className="options-grid">
              <div className={`filter-pill ${filterTime === '' ? 'active' : ''}`} onClick={() => setFilterTime('')}>
                All Time
              </div>
              <div className={`filter-pill ${filterTime === 'week' ? 'active' : ''}`} onClick={() => setFilterTime('week')}>
                This Week
              </div>
              <div className={`filter-pill ${filterTime === 'month' ? 'active' : ''}`} onClick={() => setFilterTime('month')}>
                This Month
              </div>
              <div className={`filter-pill ${filterTime === 'year' ? 'active' : ''}`} onClick={() => setFilterTime('year')}>
                This Year
              </div>
            </div>
          </div>

          {/* Section: Categories */}
          <div className="filter-section">
            <h3 className="section-title"><Layers size={18} /> Categories</h3>
            <div className="options-grid">

              <div className={`category-card ${filterCategory === '' ? 'active' : ''}`} onClick={() => setFilterCategory('')}>
                <Check size={14} className="check-icon" />
                <Folder size={28} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>All Categories</span>
              </div>

              {categories.map((cat) => (
                <div key={cat} className={`category-card ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>
                  <Check size={14} className="check-icon" />
                  <Folder size={28} />
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Types */}
          <div className="filter-section">
            <h3 className="section-title"><Layers size={18} /> Transaction Type</h3>
            <div className="options-grid">
              <div className={`filter-pill ${filterType === '' ? 'active' : ''}`} onClick={() => setFilterType('')}>
                All Types
              </div>
              {expenseTypes.map((type) => (
                <div key={type} className={`filter-pill ${filterType === type ? 'active' : ''}`} onClick={() => setFilterType(type)}>
                  {type}
                </div>
              ))}
            </div>
          </div>

          {/* Footer: Amounts & Action Buttons */}
          <div className="filter-footer">
            <div className="amounts-group">
              <div className="input-group">
                <label>Min Amount ({currencySymbol})</label>
                <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} placeholder="0" />
              </div>
              <div className="input-group">
                <label>Max Amount ({currencySymbol})</label>
                <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} placeholder="Any" />
              </div>
            </div>

            <div className="panel-actions">
              <button className="clear-btn" onClick={handleClear}>
                Clear All
              </button>
              <button className="apply-btn" onClick={() => setShowFilters(false)}>
                Apply Filters
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}