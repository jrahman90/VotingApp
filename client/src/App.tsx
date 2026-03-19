import { Suspense, lazy, ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PrivateRoute } from "./components/PrivateRoute";

const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((module) => ({
    default: module.AuthPage,
  }))
);
const VotingPage = lazy(() =>
  import("./pages/VotingPage").then((module) => ({
    default: module.VotingPage,
  }))
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((module) => ({
    default: module.AdminPage,
  }))
);
const ElectionVotersPage = lazy(() =>
  import("./pages/ElectionVotersPage").then((module) => ({
    default: module.ElectionVotersPage,
  }))
);
const ElectionResultsPage = lazy(() =>
  import("./pages/ElectionResultsPage").then((module) => ({
    default: module.ElectionResultsPage,
  }))
);
const ElectionBallotsPrintPage = lazy(() =>
  import("./pages/ElectionBallotsPrintPage").then((module) => ({
    default: module.ElectionBallotsPrintPage,
  }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Loading
        </p>
        <p className="mt-3 text-base font-semibold text-slate-900">
          Preparing the next screen...
        </p>
      </div>
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<AuthPage />),
  },
  {
    path: "/vote",
    element: withSuspense(
      <PrivateRoute role="device">
        <VotingPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin",
    element: withSuspense(
      <PrivateRoute role="admin">
        <AdminPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/operator",
    element: withSuspense(
      <PrivateRoute role="operator">
        <ElectionVotersPage operatorMode />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/elections/:votingId/voters",
    element: withSuspense(
      <PrivateRoute role="admin">
        <ElectionVotersPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/elections/:votingId/results",
    element: withSuspense(
      <PrivateRoute role="admin">
        <ElectionResultsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/elections/:votingId/ballots",
    element: withSuspense(
      <PrivateRoute role="admin">
        <ElectionBallotsPrintPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/results/:votingId",
    element: withSuspense(<ElectionResultsPage />),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
