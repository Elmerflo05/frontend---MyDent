import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search, X, User } from 'lucide-react';
import { fadeVariants, lightTransition } from '@/utils/animationConfig';

interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  description?: string;
  icon?: React.ReactNode;
  data?: any;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string, option: ComboboxOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  showSearch?: boolean;
  onCreateNew?: (searchTerm: string) => void;
  createNewLabel?: string;
  renderOption?: (option: ComboboxOption, isSelected: boolean) => React.ReactNode;
}

export const Combobox = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled = false,
  className = '',
  showSearch = true,
  onCreateNew,
  createNewLabel = 'Crear nuevo',
  renderOption
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(option => {
    const searchLower = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      option.sublabel?.toLowerCase().includes(searchLower) ||
      option.description?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value, option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', { value: '', label: '' });
    setSearchTerm('');
  };

  const defaultRenderOption = (option: ComboboxOption, isSelected: boolean) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {option.icon || <User className="w-5 h-5 text-gray-400" />}
        <div>
          <div className="font-medium text-gray-900">{option.label}</div>
          {option.sublabel && (
            <div className="text-sm text-gray-500">{option.sublabel}</div>
          )}
          {option.description && (
            <div className="text-xs text-gray-400 mt-0.5">{option.description}</div>
          )}
        </div>
      </div>
      {isSelected && (
        <Check className="w-4 h-4 text-clinic-primary flex-shrink-0" />
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-4 py-3 text-left bg-white border rounded-lg
          transition-all duration-200 flex items-center justify-between
          ${disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
            : isOpen
            ? 'border-clinic-primary ring-2 ring-clinic-primary ring-opacity-20'
            : 'border-gray-300 hover:border-gray-400 focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary focus:ring-opacity-20'
          }
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon || <User className="w-5 h-5 text-gray-400" />}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {selectedOption.label}
                </div>
                {selectedOption.sublabel && (
                  <div className="text-sm text-gray-500 truncate">
                    {selectedOption.sublabel}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {selectedOption && !disabled && (
            <div
              onClick={handleClear}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transforms ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeVariants}
            transition={lightTransition}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {showSearch && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary focus:ring-opacity-20 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <div className="py-1">
                  {filteredOptions.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                        w-full px-3 py-2.5 text-left transition-colors
                        ${index === highlightedIndex ? 'bg-gray-50' : ''}
                        ${option.value === value ? 'bg-clinic-light' : ''}
                        hover:bg-gray-50
                      `}
                    >
                      {renderOption
                        ? renderOption(option, option.value === value)
                        : defaultRenderOption(option, option.value === value)
                      }
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">{emptyMessage}</p>
                  {onCreateNew && searchTerm && (
                    <button
                      onClick={() => onCreateNew(searchTerm)}
                      className="mt-3 px-4 py-2 bg-clinic-primary text-white rounded-lg hover:bg-clinic-dark transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {createNewLabel}: "{searchTerm}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Combobox;