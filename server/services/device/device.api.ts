import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";

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

      return device;
    } catch (error) {
      console.log("🚀 ~ registerDevice ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });
