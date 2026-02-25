import React, { useState, useCallback, useRef, useEffect } from 'react';

export type ValidationRule = {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  validate?: (value: any, formData: any) => boolean | string;
  message: string;
};

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use refs for configuration to keep functions stable
  const schemaRef = useRef(validationSchema);
  const onSubmitRef = useRef(onSubmit);
  const initialValuesRef = useRef(initialValues);

  useEffect(() => {
    schemaRef.current = validationSchema;
  }, [validationSchema]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  const validateField = useCallback(
    (name: keyof T, value: any, currentValues: T) => {
      const rule = schemaRef.current[name];
      if (!rule) return '';

      if (rule.required && (value === null || value === undefined || value === '')) {
        return rule.message || `${String(name)} is required.`;
      }

      if (rule.pattern && !rule.pattern.test(String(value))) {
        return rule.message || 'Invalid format.';
      }

      if (rule.minLength && String(value).length < rule.minLength) {
        return rule.message || `Minimum length is ${rule.minLength}.`;
      }

      if (rule.validate) {
        const result = rule.validate(value, currentValues);
        if (typeof result === 'string') return result;
        if (result === false) return rule.message || 'Invalid value.';
      }

      return '';
    },
    []
  );

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error when user types
      setErrors((prevErrors) => {
        if (prevErrors[name]) {
          const newErrors = { ...prevErrors };
          delete newErrors[name];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    for (const key in schemaRef.current) {
      const error = validateField(key as keyof T, values[key], values);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [validateField, values]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // We need the latest values here. Since values is a dependency of validateForm,
    // and validateForm is a dependency of handleSubmit, this will work.
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmitRef.current(values);
      } catch (error: any) {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateForm, values]);

  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues,
    setErrors,
    resetForm,
  };
}
