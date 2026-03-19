import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VotingPage } from "./pages/VotingPage";
import { AuthPage } from "./pages/AuthPage";
import { AdminPage } from "./pages/AdminPage";
import { PrivateRoute } from "./components/PrivateRoute";
import { ElectionVotersPage } from "./pages/ElectionVotersPage";
import { ElectionResultsPage } from "./pages/ElectionResultsPage";
import { ElectionBallotsPrintPage } from "./pages/ElectionBallotsPrintPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/vote",
    element: (
      <PrivateRoute role="device">
        <VotingPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <PrivateRoute role="admin">
        <AdminPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/operator",
    element: (
      <PrivateRoute role="operator">
        <ElectionVotersPage operatorMode />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/elections/:votingId/voters",
    element: (
      <PrivateRoute role="admin">
        <ElectionVotersPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/elections/:votingId/results",
    element: (
      <PrivateRoute role="admin">
        <ElectionResultsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/elections/:votingId/ballots",
    element: (
      <PrivateRoute role="admin">
        <ElectionBallotsPrintPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/results/:votingId",
    element: <ElectionResultsPage />,
  },
]);

function App() {
  return (
    <div className="lg:container mx-auto px-4">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
