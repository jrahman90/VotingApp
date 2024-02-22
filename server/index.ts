import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { router } from "./trpc";
import { votingRouter } from "./services/voting/voting.router";
import { candidateRouter } from "./services/candidate/candidate.router";
import { panelRouter } from "./services/panel/panel.router";
import type {
  Candidate,
  Panel,
  Staff,
  Voter,
  Voting,
  Vote,
  Device,
} from "@prisma/client";
import ws from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { staffRouter } from "./services/staff/staff.router";
import { deviceRouter } from "./services/device/device.router";
import { voteRouter } from "./services/vote/vote.router";
import { OnlineDevice } from "./emitter";

const appRouter = router({
  voting: votingRouter,
  candidate: candidateRouter,
  panel: panelRouter,
  staff: staffRouter,
  device: deviceRouter,
  vote: voteRouter,
  voter: voteRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

export type CandidateType = Candidate & {
  createdAt: string;
  updatedAt: string;
};
export type PanelType = Panel & {
  createdAt: string;
  updatedAt: string;
};
export type StaffType = Staff & {
  createdAt: string;
  updatedAt: string;
};
export type VoterType = Voter & {
  createdAt: string;
  updatedAt: string;
};
export type VotingType = Voting & {
  createdAt: string;
  updatedAt: string;
};
export type VoteType = Vote & {
  createdAt: string;
  updatedAt: string;
};
export type DeviceType = Device & {
  createdAt: string;
  updatedAt: string;
};
export type OnlineDeviceType = OnlineDevice;

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
