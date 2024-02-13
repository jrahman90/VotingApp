import { router } from "../../trpc";
import { getOneVoting, getOneVotingDetailed, getAll } from "./voting.api";

export const votingRouter = router({
  getOne: getOneVoting,
  getAll,
  getOneDetailed: getOneVotingDetailed,
});
