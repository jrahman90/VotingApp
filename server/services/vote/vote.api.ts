import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import {
  EVENTS,
  OnlineDevice,
  eventEmitter,
  onlineDevices,
} from "../../emitter";

export const getAllVotes = publicProcedure.query(async () => {
  try {
    const votes = await prisma.vote.findMany();

    return votes;
  } catch (error) {
    console.log("🚀 ~ getAllVotes ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const vote = publicProcedure
  .input(
    z.object({
      selections: z
        .array(
          z.object({
            position: z.string(),
            candidateId: z.number(),
          })
        )
        .min(1),
      votingId: z.number(),
      deviceId: z.number(),
      voterId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { deviceId, selections, voterId, votingId } = input;
    const data = selections.map((selection) => ({
      deviceId,
      voterId,
      votingId,
      candidateId: selection.candidateId,
    }));
    try {
      const existingVotes = await prisma.vote.count({
        where: {
          voterId,
          votingId,
        },
      });

      if (existingVotes > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This voter has already cast a ballot for this voting.",
        });
      }

      const votes = await prisma.vote.createMany({
        data,
      });

      const device = onlineDevices
        .getDevices()
        .find((d) => d.id === deviceId);

      if (device) {
        eventEmitter.emit(
          EVENTS.CHANGE_DEVICE,
          onlineDevices.updateDevice(deviceId, {
            ...device,
            voterId: undefined,
          } as OnlineDevice)
        );
      }

      return votes;
    } catch (error) {
      console.log("🚀 ~ vote ~ error:", error);

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
