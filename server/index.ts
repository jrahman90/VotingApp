import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { router } from "./trpc";
import { votingRouter } from "./services/voting/voting.router";
import { candidateRouter } from "./services/candidate/candidate.router";
import { panelRouter } from "./services/panel/panel.router";

const appRouter = router({
  voting: votingRouter,
  candidate: candidateRouter,
  panel: panelRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
});

server.listen(3001);
