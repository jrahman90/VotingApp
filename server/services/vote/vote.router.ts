import { router } from "../../trpc";
import { getAllVotes, vote } from "./vote.api";

export const voteRouter = router({
  getAll: getAllVotes,
  vote: vote,
});
