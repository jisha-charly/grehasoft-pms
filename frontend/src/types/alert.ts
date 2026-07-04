export enum AlertVariant {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export interface AlertOptions {
  variant: AlertVariant;
  title?: string;
  message: string;
  buttonText?: string;
}

export interface QueuedAlert {
  options: AlertOptions;
  resolve: () => void;
}
