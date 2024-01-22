import { VotingPage } from "./pages/VotingPage";
import { TRPC_REACT } from "./utils/trpc";

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
      <VotingPage />
    </div>
  );
}

export default App;
