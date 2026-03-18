import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import {
  EVENTS,
  OnlineDevice,
  eventEmitter,
  eventObservable,
  onlineDevices,
} from "../../emitter";

export const getAllDevices = publicProcedure.query(async () => {
  try {
    const device = await prisma.device.findMany();

    return device;
  } catch (error) {
    console.log("🚀 ~ getAllDevices ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const getConnectedDevices = publicProcedure.subscription(async () => {
  try {
    // return an `observable` with a callback which is triggered immediately
    return eventObservable<OnlineDevice[]>((emit) => {
      const onChange = (data: OnlineDevice[]) => {
        console.log("🚀 ~ onChange ~ data:", data);
        // emit data to client
        emit.next(data);
      };
      emit.next(onlineDevices.getDevices());
      // trigger `onAdd()` when `add` is triggered in our event emitter
      eventEmitter.on(EVENTS.REGISTER_DEVICE, onChange);
      eventEmitter.on(EVENTS.UNREGISTER_DEVICE, onChange);
      eventEmitter.on(EVENTS.CHANGE_DEVICE, onChange);
      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        eventEmitter.off(EVENTS.REGISTER_DEVICE, onChange);
        eventEmitter.off(EVENTS.UNREGISTER_DEVICE, onChange);
        eventEmitter.off(EVENTS.CHANGE_DEVICE, onChange);
      };
    });
  } catch (error) {
    console.log("🚀 ~ getAllDevices ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const registerDevice = publicProcedure
  .input(
    z.object({
      name: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { name } = input;
    try {
      const device = await prisma.device.upsert({
        where: {
          name,
        },
        create: {
          name,
        },
        update: {
          name,
        },
      });

      const existingOnlineDevice = onlineDevices
        .getDevices()
        .find((onlineDevice) => onlineDevice.id === device.id);

      eventEmitter.emit(
        EVENTS.REGISTER_DEVICE,
        onlineDevices.addDevice({
          ...existingOnlineDevice,
          ...device,
          voterId: undefined,
        })
      );
      return device;
    } catch (error) {
      console.log("🚀 ~ registerDevice ~ error:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const unRegisterDevice = publicProcedure
  .input(
    z.object({
      name: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { name } = input;
    try {
      const device = await prisma.device.findFirst({
        where: {
          name,
        },
      });

      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found.",
        });
      }

      eventEmitter.emit(
        EVENTS.UNREGISTER_DEVICE,
        onlineDevices.removeDevice(device.id)
      );
      return device;
    } catch (error) {
      console.log("🚀 ~ unregisterDevice ~ error:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const assignVoter = publicProcedure
  .input(
    z.object({
      name: z.string(),
      voterId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { name } = input;
    try {
      const device = await prisma.device.findFirst({
        where: {
          name,
        },
      });
      const voter = await prisma.voter.findFirst({
        where: {
          voterId: input.voterId,
        },
      });
      const activeVoting = await prisma.voting.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found.",
        });
      }

      if (!voter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voter not found.",
        });
      }

      if (!activeVoting) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "There is no active election.",
        });
      }

      const eligibleVoter = await prisma.electionVoter.findUnique({
        where: {
          votingId_voterId: {
            votingId: activeVoting.id,
            voterId: voter.voterId,
          },
        },
      });

      if (!eligibleVoter) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This voter is not assigned to the active election.",
        });
      }

      const onlineDevice = onlineDevices
        .getDevices()
        .find((currentDevice) => currentDevice.id === device.id);

      if (!onlineDevice) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Device is not connected.",
        });
      }

      const voterAssignedDevice = onlineDevices
        .getDevices()
        .find(
          (currentDevice) =>
            currentDevice.voterId === voter.voterId &&
            currentDevice.id !== device.id
        );

      if (voterAssignedDevice) {
        onlineDevices.updateDevice(voterAssignedDevice.id, {
          ...voterAssignedDevice,
          voterId: undefined,
        } as OnlineDevice);
      }

      eventEmitter.emit(
        EVENTS.CHANGE_DEVICE,
        onlineDevices.updateDevice(device.id, {
          ...onlineDevice,
          voterId: voter.voterId,
        } as OnlineDevice)
      );
      return device;
    } catch (error) {
      console.log("🚀 ~ unregisterDevice ~ error:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const unassignVoter = publicProcedure
  .input(
    z.object({
      name: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const device = await prisma.device.findFirst({
        where: {
          name: input.name,
        },
      });

      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found.",
        });
      }

      const onlineDevice = onlineDevices
        .getDevices()
        .find((currentDevice) => currentDevice.id === device.id);

      if (!onlineDevice) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Device is not connected.",
        });
      }

      eventEmitter.emit(
        EVENTS.CHANGE_DEVICE,
        onlineDevices.updateDevice(device.id, {
          ...onlineDevice,
          voterId: undefined,
        } as OnlineDevice)
      );

      return device;
    } catch (error) {
      console.log("🚀 ~ unassignVoter ~ error:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });
