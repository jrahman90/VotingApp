import { router } from "../../trpc";
import { getAllDevices, registerDevice } from "./device.api";

export const deviceRouter = router({
  getAll: getAllDevices,
  register: registerDevice,
});
