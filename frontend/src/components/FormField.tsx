
import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
  name?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  value?: any;
  onChange?: (name: any, value: any) => void;
  placeholder?: string;
  options?: { label: string; value: string }[];
  rows?: number;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, error, required, children, className = '',
  name, type = 'text', value, onChange, placeholder, options = [], rows = 3, disabled = false
}) => {
  const inputClassName = `form-control ${error ? 'is-invalid' : ''}`;

  const renderInput = () => {
    if (children) {
      return React.isValidElement(children) 
        ? React.cloneElement(children as React.ReactElement<any>, {
            className: `${(children.props as any)?.className || ''} ${error ? 'is-invalid' : ''}`.trim(),
          })
        : children;
    }

    if (!name || !onChange) return null;

    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            className={`form-select ${error ? 'is-invalid' : ''}`}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            disabled={disabled}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            name={name}
            className={inputClassName}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
          />
        );
      case 'file':
        return (
          <input
            type="file"
            name={name}
            className={inputClassName}
            onChange={(e) => onChange(name, e.target.files?.[0] || null)}
            disabled={disabled}
          />
        );
      default:
        return (
          <input
            type={type}
            name={name}
            className={inputClassName}
            value={value}
            onChange={(e) => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={`mb-3 ${className}`}>
      <label className="form-label small fw-bold text-secondary text-uppercase mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {renderInput()}
      {error && (
        <div className="text-danger smaller mt-1 fw-medium animate-fade-in">
          <i className="bi bi-exclamation-circle me-1"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
