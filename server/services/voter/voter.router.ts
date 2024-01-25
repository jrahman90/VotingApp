import { router } from "../../trpc";
import { getAllVoters } from "./voter.api";

export const votersRouter = router({
  getAll: getAllVoters,
});
