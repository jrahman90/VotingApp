import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VotingPage } from "./pages/VotingPage";
import { TRPC_REACT } from "./utils/trpc";
import { AuthPage } from "./pages/AuthPage";
import { AdminPage } from "./pages/AdminPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/vote",
    element: <VotingPage device="Computer#1 San Francisco" voterId={1234} />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
]);

function App() {
  TRPC_REACT.subs.useSubscription(undefined, {
    onData(data) {
      console.log("🚀 ~ onData ~ data:", data);
    },
    onError(err) {
      console.log("🚀 ~ onError ~ err:", err);
    },
    onStarted() {
      console.log("started");
    },
  });
  return (
    <div className="lg:container mx-auto px-4">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
