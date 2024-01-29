import { router } from "../../trpc";
import {
  getAllDevices,
  registerDevice,
  unRegisterDevice,
  getConnectedDevices,
  assignVoter,
} from "./device.api";

export const deviceRouter = router({
  getAll: getAllDevices,
  getConnectedDevices: getConnectedDevices,
  register: registerDevice,
  unregister: unRegisterDevice,
  assignVoter,
});
