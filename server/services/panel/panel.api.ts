import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";

export const getAllPanels = publicProcedure.query(async () => {
  try {
    const panels = await prisma.panel.findMany();

    return panels;
  } catch (error) {
    console.log("🚀 ~ getAllPanels ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const createPanel = publicProcedure
  .input(
    z.object({
      img: z.string(),
      panelColor: z.string(),
      panelName: z.string(),
      textColor: z.string(),
      votingId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const { img, panelColor, panelName, textColor, votingId } = input;
      const panel = await prisma.panel.create({
        data: {
          img,
          panelColor,
          panelName,
          textColor,
          votingId,
        },
      });

      return panel;
    } catch (error) {
      console.log("🚀 ~ createPanel ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const updatePanel = publicProcedure
  .input(
    z.object({
      img: z.string(),
      panelColor: z.string(),
      panelName: z.string(),
      textColor: z.string(),
      votingId: z.number(),
      panelId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const { img, panelColor, panelName, textColor, votingId, panelId } =
        input;
      const panel = await prisma.panel.update({
        where: { id: panelId },
        data: {
          img,
          panelColor,
          panelName,
          textColor,
          votingId,
        },
      });

      return panel;
    } catch (error) {
      console.log("🚀 ~ createPanel ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const getByVotingId = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    try {
      const panel = await prisma.panel.findFirst({
        where: {
          votingId: input.id,
        },
      });

      return panel;
    } catch (error) {
      console.log("🚀 ~ getByVotingId ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });
