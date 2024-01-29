import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VotingPage } from "./pages/VotingPage";
import { AuthPage } from "./pages/AuthPage";
import { AdminPage } from "./pages/AdminPage";
import { PrivateRoute } from "./components/PrivateRoute";

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
      <PrivateRoute role="staff">
        <AdminPage />
      </PrivateRoute>
    ),
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
