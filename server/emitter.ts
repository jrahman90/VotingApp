import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { Device } from "@prisma/client";

export const eventEmitter = new EventEmitter();
export const eventObservable = observable;

export const EVENTS = {
  REGISTER_DEVICE: "REGISTER_DEVICE",
  UNREGISTER_DEVICE: "UNREGISTER_DEVICE",
  CHANGE_DEVICE: "CHANGE_DEVICE",
};

export interface OnlineDevice extends Device {
  voterId?: number;
}

class OnlineDevices {
  devices = [] as OnlineDevice[];

  getDevices() {
    return this.devices;
  }

  setDevices(payload: OnlineDevice[]) {
    this.devices = payload;
    return this.getDevices();
  }

  addDevice(payload: OnlineDevice) {
    const devices = this.getDevices();
    const existingIdx = devices.findIndex((device) => device.id === payload.id);

    if (existingIdx >= 0) {
      devices[existingIdx] = {
        ...devices[existingIdx],
        ...payload,
      };
      return this.setDevices([...devices]);
    }

    const nextDevices = [...devices, payload];
    return this.setDevices(nextDevices);
  }

  removeDevice(id: number) {
    let devices = this.getDevices().filter((d) => d.id !== id);
    return this.setDevices(devices);
  }

  updateDevice(id: number, payload: OnlineDevice) {
    const idx = this.getDevices().findIndex((d) => d.id === id);
    if (idx < 0) {
      return this.getDevices();
    }

    const devices = this.getDevices();
    devices[idx] = payload;
    return this.setDevices([...devices]);
  }
}

export const onlineDevices = new OnlineDevices();
