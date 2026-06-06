import React, { useState, useEffect, useRef, useMemo } from 'react';

// A premium searchable select dropdown that filters options on typing and opens on focus
const SearchableSelect = ({ options = [], value, onChange, placeholder, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Normalize options to [{ label, value }] format
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          label: opt.label || opt.name || '',
          value: opt.value !== undefined ? opt.value : opt._id
        };
      }
      return { label: String(opt), value: opt };
    });
  }, [options]);

  // Find the label matching the current value
  const currentLabel = useMemo(() => {
    const selectedOpt = normalizedOptions.find(opt => opt.value === value);
    return selectedOpt ? selectedOpt.label : '';
  }, [value, normalizedOptions]);

  // Sync internal search state when the selected value changes
  useEffect(() => {
    setSearch(currentLabel);
  }, [currentLabel]);

  // Click outside closes the dropdown and resets the search text to the active selection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch(currentLabel);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentLabel]);

  // Filter options based on query. If query is empty or matches current selection exactly, show all options.
  const filteredOptions = useMemo(() => {
    if (!search || search === currentLabel) {
      return normalizedOptions;
    }
    const query = search.toLowerCase();
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(query)
    );
  }, [search, currentLabel, normalizedOptions]);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearch(option.label);
    setIsOpen(false);
  };

  return (
    <div className="searchable-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div className="searchable-select-input-wrapper" style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          required={required}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={(e) => {
            setIsOpen(true);
            // Highlight existing text so user can immediately type to overwrite
            if (e.target.select) {
              e.target.select();
            }
          }}
          style={{ width: '100%', margin: 0 }}
        />
        <span 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            fontSize: '10px',
            color: '#666',
            userSelect: 'none'
          }}
        >
          {isOpen ? '▲' : '▼'}
        </span>
      </div>
      
      {isOpen && (
        <ul className="searchable-select-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--surface-color, #ffffff)',
          border: '1px solid var(--card-border, #e2e8f0)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 1000,
          padding: '4px 0',
          margin: '4px 0 0 0',
          listStyle: 'none'
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(option)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  backgroundColor: value === option.value ? 'rgba(0, 143, 210, 0.08)' : 'transparent',
                  color: value === option.value ? '#008fd2' : 'var(--text-color, #334155)',
                  fontWeight: value === option.value ? '600' : 'normal',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background-color, #f8fafc)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = value === option.value ? 'rgba(0, 143, 210, 0.08)' : 'transparent'}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li style={{ padding: '10px 14px', color: '#888', fontSize: '13.5px', textAlign: 'center' }}>
              No matches found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
