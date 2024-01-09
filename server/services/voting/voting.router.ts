import { router } from "../../trpc";
import { getOneVoting, getOneVotingDetailed } from "./voting.api";

export const votingRouter = router({
  getOne: getOneVoting,
  getOneDetailed: getOneVotingDetailed,
});
