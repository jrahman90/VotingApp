import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { router } from "./trpc";
import { votingRouter } from "./services/voting/voting.router";
import { candidateRouter } from "./services/candidate/candidate.router";
import { panelRouter } from "./services/panel/panel.router";
import type { Candidate, Panel, User, Voter, Voting } from "@prisma/client";

const appRouter = router({
  voting: votingRouter,
  candidate: candidateRouter,
  panel: panelRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

export type CandidateType = Candidate;
export type PanelType = Panel;
export type UserType = User;
export type VoterType = Voter;
export type VotingType = Voting;

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
});

server.listen(3001);
