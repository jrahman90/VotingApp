import { Alert } from "react-bootstrap";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AlertVariant = "success" | "danger" | "warning" | "info";

interface AppAlert {
  id: number;
  message: string;
  variant: AlertVariant;
}

interface AlertContextValue {
  showAlert: (message: string, variant?: AlertVariant) => void;
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
      },
    ]);
  }, []);

  const dismissAlert = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      showAlert,
    }),
    [showAlert]
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
    const timeout = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="pointer-events-auto">
      <Alert variant={alert.variant} dismissible onClose={onClose} className="mb-0 shadow-lg">
        {alert.message}
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
