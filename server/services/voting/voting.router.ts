import { router } from "../../trpc";
import { getOneVoting } from "./voting.api";

export const votingRouter = router({
  getOne: getOneVoting,
});
