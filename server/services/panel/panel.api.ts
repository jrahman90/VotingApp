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
      candidates: z.array(
        z.object({
          name: z.string(),
          img: z.string(),
          position: z.string().min(1),
        })
      ),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const { img, panelColor, panelName, textColor, votingId, candidates } =
        input;
      const panel = await prisma.$transaction(async (tx) => {
        const createdPanel = await tx.panel.create({
          data: {
            img,
            panelColor,
            panelName,
            textColor,
            votingId,
          },
        });

        for (const candidate of candidates) {
          const createdCandidate = await tx.candidate.create({
            data: {
              name: candidate.name,
              img: candidate.img,
              position: candidate.position,
            },
          });

          await tx.candidatesOnPanels.create({
            data: {
              panelId: createdPanel.id,
              candidateId: createdCandidate.id,
            },
          });
        }

        return tx.panel.findUnique({
          where: {
            id: createdPanel.id,
          },
          include: {
            Candidates: {
              include: {
                Candidate: true,
              },
            },
          },
        });
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
      candidates: z.array(
        z.object({
          id: z.number().optional(),
          name: z.string(),
          img: z.string(),
          position: z.string().min(1),
        })
      ),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const {
        img,
        panelColor,
        panelName,
        textColor,
        votingId,
        panelId,
        candidates,
      } = input;
      const panel = await prisma.$transaction(async (tx) => {
        await tx.panel.update({
          where: { id: panelId },
          data: {
            img,
            panelColor,
            panelName,
            textColor,
            votingId,
          },
        });

        const existingLinks = await tx.candidatesOnPanels.findMany({
          where: {
            panelId,
          },
          include: {
            Candidate: true,
          },
        });

        const existingCandidateIds = existingLinks.map(
          (link) => link.Candidate.id
        );
        const incomingCandidateIds = candidates
          .map((candidate) => candidate.id)
          .filter((candidateId): candidateId is number => !!candidateId);

        for (const link of existingLinks) {
          const incomingCandidate = candidates.find(
            (candidate) => candidate.id === link.Candidate.id
          );

          if (incomingCandidate) {
            await tx.candidate.update({
              where: {
                id: link.Candidate.id,
              },
              data: {
                name: incomingCandidate.name,
                img: incomingCandidate.img,
                position: incomingCandidate.position,
              },
            });
          }
        }

        const newCandidates = candidates.filter((candidate) => !candidate.id);
        for (const candidate of newCandidates) {
          const createdCandidate = await tx.candidate.create({
            data: {
              name: candidate.name,
              img: candidate.img,
              position: candidate.position,
            },
          });

          await tx.candidatesOnPanels.create({
            data: {
              panelId,
              candidateId: createdCandidate.id,
            },
          });
        }

        const removedCandidateIds = existingCandidateIds.filter(
          (candidateId) => !incomingCandidateIds.includes(candidateId)
        );

        if (removedCandidateIds.length > 0) {
          await tx.vote.deleteMany({
            where: {
              candidateId: {
                in: removedCandidateIds,
              },
            },
          });

          await tx.candidatesOnPanels.deleteMany({
            where: {
              panelId,
              candidateId: {
                in: removedCandidateIds,
              },
            },
          });

          await tx.candidate.deleteMany({
            where: {
              id: {
                in: removedCandidateIds,
              },
            },
          });
        }

        return tx.panel.findUnique({
          where: {
            id: panelId,
          },
          include: {
            Candidates: {
              include: {
                Candidate: true,
              },
            },
          },
        });
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

export const deletePanel = publicProcedure
  .input(z.object({ panelId: z.number() }))
  .mutation(async ({ input }) => {
    try {
      const deletedPanel = await prisma.$transaction(async (tx) => {
        const panel = await tx.panel.findUnique({
          where: {
            id: input.panelId,
          },
        });

        if (!panel) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Panel not found.",
          });
        }

        const candidateLinks = await tx.candidatesOnPanels.findMany({
          where: {
            panelId: input.panelId,
          },
        });
        const candidateIds = candidateLinks.map((link) => link.candidateId);

        if (candidateIds.length > 0) {
          await tx.vote.deleteMany({
            where: {
              candidateId: {
                in: candidateIds,
              },
            },
          });

          await tx.candidatesOnPanels.deleteMany({
            where: {
              panelId: input.panelId,
            },
          });

          await tx.candidate.deleteMany({
            where: {
              id: {
                in: candidateIds,
              },
            },
          });
        }

        await tx.panel.delete({
          where: {
            id: input.panelId,
          },
        });

        return panel;
      });

      return deletedPanel;
    } catch (error) {
      console.log("🚀 ~ deletePanel ~ error:", error);

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

export const getByVotingId = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    try {
      const panel = await prisma.panel.findMany({
        where: {
          votingId: input.id,
        },
        include: {
          Candidates: {
            include: {
              Candidate: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
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
