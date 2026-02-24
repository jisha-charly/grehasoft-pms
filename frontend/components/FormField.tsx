
import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, required, children, className = '' }) => {
  // Clone the child and inject error styling if needed
  const child = React.isValidElement(children) 
    ? React.cloneElement(children as React.ReactElement<any>, {
        className: `${(children.props as any)?.className || ''} ${error ? 'border-danger shadow-none' : ''}`.trim(),
      })
    : children;

  return (
    <div className={`form-field-container ${className}`}>
      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {child}
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
