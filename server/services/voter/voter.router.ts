import { router } from "../../trpc";
import { getAllVoters, getVoterById, importVoters } from "./voter.api";

export const votersRouter = router({
  getAll: getAllVoters,
  getById: getVoterById,
  importMany: importVoters,
});
