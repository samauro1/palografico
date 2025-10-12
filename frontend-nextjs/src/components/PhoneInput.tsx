import React, { useState, useEffect } from 'react';
import { applyPhoneMask, cleanPhone, isValidPhone } from '@/utils/phoneUtils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "(11) 99999-9999",
  className = "",
  required = false,
  disabled = false,
  error
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Quando o valor externo muda, atualiza o display
    if (value) {
      setDisplayValue(applyPhoneMask(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const maskedValue = applyPhoneMask(inputValue);
    
    setDisplayValue(maskedValue);
    
    // Envia o valor limpo (apenas números) para o componente pai
    const cleanValue = cleanPhone(inputValue);
    onChange(cleanValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas números, backspace, delete, tab, escape, enter
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Permite apenas números
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const isValid = !value || isValidPhone(value);

  return (
    <div className="w-full">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error || !isValid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
        maxLength={15} // (11) 99999-9999 = 15 caracteres
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!isValid && value && (
        <p className="mt-1 text-sm text-red-600">Telefone deve ter 10 ou 11 dígitos</p>
      )}
    </div>
  );
}

