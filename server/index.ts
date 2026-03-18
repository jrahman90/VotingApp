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
import { votersRouter } from "./services/voter/voter.router";

const port = Number(process.env.PORT || 3001);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const appRouter = router({
  voting: votingRouter,
  candidate: candidateRouter,
  panel: panelRouter,
  staff: staffRouter,
  device: deviceRouter,
  vote: voteRouter,
  voter: votersRouter,
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

const server = createHTTPServer({
  middleware: cors({
    origin: allowedOrigins,
  }),
  router: appRouter,
});

const wss = new ws.Server({ server: server.server });
const handler = applyWSSHandler({ wss, router: appRouter });

wss.on("connection", (socket) => {
  console.log(`WebSocket connection (${wss.clients.size})`);
  socket.once("close", () => {
    console.log(`WebSocket disconnect (${wss.clients.size})`);
  });
});

server.listen(port, "0.0.0.0");
console.log(`✅ HTTP and WebSocket server listening on port ${port}`);
console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close(() => {
    server.server.close();
  });
});
