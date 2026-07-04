import axios from "axios";

export const getErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === "string") {
      return data;
    }
    if (data.message && typeof data.message === "string") {
      return data.message;
    }
    if (data.error && typeof data.error === "string") {
      return data.error;
    }
    if (data.detail && typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    if (Array.isArray(data.proof_file) && data.proof_file.length > 0) {
      return data.proof_file[0];
    }
    
    // Check for other DRF field-specific validation errors (e.g. { field_name: ["error string"] })
    const firstFieldKey = Object.keys(data)[0];
    if (firstFieldKey && Array.isArray(data[firstFieldKey]) && data[firstFieldKey].length > 0) {
      const fieldName = firstFieldKey.replace(/_/g, " ");
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${data[firstFieldKey][0]}`;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return "An unexpected error occurred. Please try again.";
};
