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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" placeholder="Search descriptions..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 15px', width: '300px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1E293B', color: 'white' }}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '10px 20px', backgroundColor: showFilters ? '#475569' : '#1E293B', color: 'white', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        <button
          onClick={onAddNew}
          style={{ padding: '10px 20px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Add New Expense
        </button>
      </div>

      {showFilters && (
        <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: '#94a3b8', fontSize: '12px' }}>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#1E293B', color: 'white', border: '1px solid #334155' }}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: '#94a3b8', fontSize: '12px' }}>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#1E293B', color: 'white', border: '1px solid #334155' }}>
              <option value="">All Types</option>
              {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: '#94a3b8', fontSize: '12px' }}>Time Range</label>
            <select value={filterTime} onChange={(e) => setFilterTime(e.target.value)} style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#1E293B', color: 'white', border: '1px solid #334155' }}>
              <option value="">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: '#94a3b8', fontSize: '12px' }}>Min Amount ($)</label>
            <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} placeholder="0" style={{ padding: '8px', width: '100px', borderRadius: '4px', backgroundColor: '#1E293B', color: 'white', border: '1px solid #334155' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: '#94a3b8', fontSize: '12px' }}>Max Amount ($)</label>
            <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} placeholder="Any" style={{ padding: '8px', width: '100px', borderRadius: '4px', backgroundColor: '#1E293B', color: 'white', border: '1px solid #334155' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={handleClear}
              style={{ padding: '8px 15px', backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '4px', cursor: 'pointer' }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </>
  );
}