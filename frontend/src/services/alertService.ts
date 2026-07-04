import { AlertOptions } from "../types/alert";

type ShowAlertFn = (options: AlertOptions) => Promise<void>;

let globalShowAlert: ShowAlertFn | null = null;

export const registerAlertService = (showAlertFn: ShowAlertFn) => {
  globalShowAlert = showAlertFn;
};

export const alertService = {
  showAlert: (options: AlertOptions): Promise<void> => {
    if (globalShowAlert) {
      return globalShowAlert(options);
    }
    console.warn("alertService.showAlert called before AlertProvider was mounted.");
    return Promise.resolve();
  },
};
export default alertService;
