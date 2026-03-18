import { router } from "../../trpc";
import {
  getOneVoting,
  getVotingById,
  getVotingRoster,
  getOneVotingDetailed,
  getAll,
  createVoting,
  updateVoting,
  setActiveVoting,
  deleteVoting,
  clearVotingVoters,
} from "./voting.api";

export const votingRouter = router({
  getOne: getOneVoting,
  getById: getVotingById,
  getRoster: getVotingRoster,
  getAll,
  getOneDetailed: getOneVotingDetailed,
  create: createVoting,
  update: updateVoting,
  setActive: setActiveVoting,
  delete: deleteVoting,
  clearVoters: clearVotingVoters,
});
