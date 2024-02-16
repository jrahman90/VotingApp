import { router } from "../../trpc";
import {
  getOneVoting,
  getOneVotingDetailed,
  getAll,
  createVoting,
  updateVoting,
} from "./voting.api";

export const votingRouter = router({
  getOne: getOneVoting,
  getAll,
  getOneDetailed: getOneVotingDetailed,
  create: createVoting,
  update: updateVoting,
});
