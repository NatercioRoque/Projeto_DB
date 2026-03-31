import { useState, useRef, useEffect } from 'react';

export default function AutocompleteSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Buscar na lista...",
  keyFn = (item) => item.id,
  labelFn = (item) => item.nome,
  subLabelFn = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const isTypingRef = useRef(false);

  // Sync internal search term when external value changes
  useEffect(() => {
    if (value) {
      const selectedItem = options.find(opt => keyFn(opt) === value);
      if (selectedItem) {
        setSearchTerm(labelFn(selectedItem));
      } else {
        if (!isTypingRef.current) setSearchTerm('');
      }
    } else {
      if (!isTypingRef.current) setSearchTerm('');
    }
    isTypingRef.current = false;
  }, [value, options, keyFn, labelFn]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // Restaura a string p/ o valor atual se não validou
        if (value) {
          const selectedItem = options.find(opt => keyFn(opt) === value);
          if (selectedItem) setSearchTerm(labelFn(selectedItem));
        } else {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef, value, options, keyFn, labelFn]);

  const filteredOptions = options
    .filter(opt => labelFn(opt).toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 5); // Exibir até 5 opções

  const handleSelect = (item) => {
    onChange(keyFn(item));
    setSearchTerm(labelFn(item));
    setIsOpen(false);
  };

  const handleChange = (e) => {
    isTypingRef.current = true;
    setSearchTerm(e.target.value);
    setIsOpen(true);
    // If user starts typing, we clear the specific ID selection so it's strictly enforced.
    onChange(''); 
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="form-input"
        style={{ width: '100%', boxSizing: 'border-box' }}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        required
      />
      {isOpen && (searchTerm.length >= 0) && (
        <ul className="suggestions-list" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(30, 30, 45, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--surface-glass-border)',
          borderRadius: 'var(--radius-sm)',
          marginTop: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999,
          padding: 0,
          margin: 0,
          listStyle: 'none'
        }}>
          {filteredOptions.length > 0 ? filteredOptions.map(item => (
            <li 
              key={keyFn(item)} 
              onClick={() => handleSelect(item)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'background 0.2s',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: '500' }}>{labelFn(item)}</div>
              {subLabelFn && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subLabelFn(item)}</div>}
            </li>
          )) : (
             <li style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum resultado...</li>
          )}
        </ul>
      )}
    </div>
  );
}
