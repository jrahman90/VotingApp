import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { publicProcedure, router } from "./trpc";
import { votingRouter } from "./services/voting/voting.router";
import { candidateRouter } from "./services/candidate/candidate.router";
import { panelRouter } from "./services/panel/panel.router";
import type { Candidate, Panel, User, Voter, Voting } from "@prisma/client";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";
import ws from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";

const ee = new EventEmitter();

const appRouter = router({
  voting: votingRouter,
  candidate: candidateRouter,
  panel: panelRouter,
  subs: publicProcedure.subscription(() => {
    return observable<any>((emit) => {
      console.log("hi server");
      emit.next("hi client!");
      return () => {
        console.log("bye server");
      };
    });
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

export type CandidateType = Candidate;
export type PanelType = Panel;
export type UserType = User;
export type VoterType = Voter;
export type VotingType = Voting;

const wss = new ws.Server({
  port: 3002,
});
const handler = applyWSSHandler({ wss, router: appRouter });

wss.on("connection", (ws) => {
  console.log(`Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(` Connection (${wss.clients.size})`);
  });
});
console.log("✅ WebSocket Server listening on ws://localhost:3002");
process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
});

server.listen(3001);
