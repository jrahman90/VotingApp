import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { TRPC_CLIENT, TRPC_REACT, queryClient } from "./utils/trpc";

import App from "./App.tsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Provider } from "react-redux";
import { persistor, store } from "./store/store.ts";
import { PersistGate } from "redux-persist/integration/react";
import { AlertProvider } from "./utils/alerts.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TRPC_REACT.Provider client={TRPC_CLIENT} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <AlertProvider>
              <App />
            </AlertProvider>
          </PersistGate>
        </Provider>
      </QueryClientProvider>
    </TRPC_REACT.Provider>
  </React.StrictMode>
);
