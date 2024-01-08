import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { TRPC_CLIENT, TRPC_REACT, queryClient } from "./utils/trpc";

import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TRPC_REACT.Provider client={TRPC_CLIENT} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </TRPC_REACT.Provider>
  </React.StrictMode>
);
