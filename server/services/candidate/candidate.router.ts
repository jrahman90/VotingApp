import { router } from "../../trpc";
import { getAllCandidates } from "./candidate.api";

export const candidateRouter = router({
  getAll: getAllCandidates,
});
