import { Alert } from "react-bootstrap";
import {
  createContext,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AlertVariant = "success" | "danger" | "warning" | "info";

interface AlertAction {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  onClick: () => void;
}

interface AppAlert {
  id: number;
  message: string;
  variant: AlertVariant;
  actions?: AlertAction[];
  autoDismiss?: boolean;
}

interface AlertContextValue {
  showAlert: (message: string, variant?: AlertVariant) => void;
  showConfirmAlert: (
    message: string,
    actions: AlertAction[],
    variant?: AlertVariant
  ) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AppAlert[]>([]);

  const showAlert = useCallback((message: string, variant: AlertVariant = "danger") => {
    setAlerts((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        message,
        variant,
        autoDismiss: true,
      },
    ]);
  }, []);

  const showConfirmAlert = useCallback(
    (
      message: string,
      actions: AlertAction[],
      variant: AlertVariant = "warning"
    ) => {
      setAlerts((current) => [
        ...current,
        {
          id: Date.now() + Math.random(),
          message,
          variant,
          actions,
          autoDismiss: false,
        },
      ]);
    },
    []
  );

  const dismissAlert = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      showAlert,
      showConfirmAlert,
    }),
    [showAlert, showConfirmAlert]
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[1000] mx-auto flex max-w-3xl flex-col gap-3 px-4">
        {alerts.map((alert) => (
          <TimedAlert
            key={alert.id}
            alert={alert}
            onClose={() => dismissAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

function TimedAlert({
  alert,
  onClose,
}: {
  alert: AppAlert;
  onClose: () => void;
}) {
  useEffect(() => {
    if (alert.autoDismiss === false) {
      return;
    }

    const timeout = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeout);
  }, [alert.autoDismiss, onClose]);

  const onActionClick =
    (handler: () => void): MouseEventHandler<HTMLButtonElement> =>
    () => {
      handler();
      onClose();
    };

  return (
    <div className="pointer-events-auto">
      <Alert variant={alert.variant} dismissible onClose={onClose} className="mb-0 shadow-lg">
        <div className="flex flex-col gap-3">
          <div>{alert.message}</div>
          {alert.actions && alert.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alert.actions.map((action) => {
                const buttonClasses =
                  action.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : action.variant === "secondary"
                      ? "bg-slate-200 text-slate-900 hover:bg-slate-300"
                      : "bg-blue-600 text-white hover:bg-blue-700";

                return (
                  <button
                    key={action.label}
                    type="button"
                    className={`rounded px-3 py-2 text-sm font-semibold transition ${buttonClasses}`}
                    onClick={onActionClick(action.onClick)}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}

export function useAppAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAppAlert must be used inside AlertProvider");
  }

  return context;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
