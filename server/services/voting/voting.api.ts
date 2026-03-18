import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { EVENTS, eventEmitter, onlineDevices } from "../../emitter";

export const getOneVoting = publicProcedure.query(async () => {
  try {
    let voting = await prisma.voting.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!voting) {
      voting = await prisma.voting.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return voting;
  } catch (error) {
    console.log("🚀 ~ getOneVoting ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const getVotingById = publicProcedure
  .input(z.object({ votingId: z.number() }))
  .query(async ({ input }) => {
    try {
      const voting = await prisma.voting.findUnique({
        where: {
          id: input.votingId,
        },
        include: {
          Votes: true,
          Panels: {
            include: {
              Candidates: {
                include: {
                  Candidate: true,
                },
              },
            },
          },
          Voters: {
            include: {
              Voter: true,
            },
          },
        },
      });

      return voting;
    } catch (error) {
      console.log("🚀 ~ getVotingById ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const getVotingRoster = publicProcedure
  .input(z.object({ votingId: z.number() }))
  .query(async ({ input }) => {
    try {
      const [voting, votedRows] = await Promise.all([
        prisma.voting.findUnique({
          where: {
            id: input.votingId,
          },
          select: {
            id: true,
            name: true,
            img: true,
            Voters: {
              orderBy: {
                voterId: "asc",
              },
              select: {
                id: true,
                votingId: true,
                voterId: true,
                extraFields: true,
                Voter: {
                  select: {
                    id: true,
                    voterId: true,
                    firstAndMiddleName: true,
                    lastName: true,
                    streetAddress: true,
                    city: true,
                    state: true,
                    phone: true,
                    yob: true,
                    permanentAddress: true,
                    comments: true,
                  },
                },
              },
            },
          },
        }),
        prisma.vote.findMany({
          where: {
            votingId: input.votingId,
          },
          distinct: ["voterId"],
          select: {
            voterId: true,
          },
        }),
      ]);

      if (!voting) {
        return null;
      }

      return {
        ...voting,
        votedVoterIds: votedRows.map((row) => row.voterId),
      };
    } catch (error) {
      console.log("🚀 ~ getVotingRoster ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const createVoting = publicProcedure
  .input(
    z.object({
      name: z.string(),
      img: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const existingActiveVoting = await prisma.voting.findFirst({
        where: {
          isActive: true,
        },
      });

      const voting = await prisma.voting.create({
        data: {
          name: input.name,
          img: input.img,
          isActive: !existingActiveVoting,
        },
      });

      return voting;
    } catch (error) {
      console.log("🚀 ~ createVoting ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const updateVoting = publicProcedure
  .input(
    z.object({
      name: z.string(),
      img: z.string().optional(),
      votingId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const voting = await prisma.voting.update({
        where: {
          id: input.votingId,
        },
        data: {
          name: input.name,
          ...(input.img ? { img: input.img } : {}),
        },
      });

      return voting;
    } catch (error) {
      console.log("🚀 ~ updateVoting ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const setActiveVoting = publicProcedure
  .input(z.object({ votingId: z.number() }))
  .mutation(async ({ input }) => {
    try {
      const voting = await prisma.$transaction(async (tx) => {
        await tx.voting.updateMany({
          data: {
            isActive: false,
          },
        });

        return tx.voting.update({
          where: {
            id: input.votingId,
          },
          data: {
            isActive: true,
          },
        });
      });

      return voting;
    } catch (error) {
      console.log("🚀 ~ setActiveVoting ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const deleteVoting = publicProcedure
  .input(z.object({ votingId: z.number() }))
  .mutation(async ({ input }) => {
    try {
      const deletedVoting = await prisma.$transaction(async (tx) => {
        const voting = await tx.voting.findUnique({
          where: {
            id: input.votingId,
          },
        });

        if (!voting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Election not found.",
          });
        }

        const panels = await tx.panel.findMany({
          where: {
            votingId: input.votingId,
          },
          select: {
            id: true,
          },
        });
        const panelIds = panels.map((panel) => panel.id);

        const candidateLinks =
          panelIds.length > 0
            ? await tx.candidatesOnPanels.findMany({
                where: {
                  panelId: {
                    in: panelIds,
                  },
                },
                select: {
                  candidateId: true,
                },
              })
            : [];
        const candidateIds = candidateLinks.map((link) => link.candidateId);

        await tx.vote.deleteMany({
          where: {
            votingId: input.votingId,
          },
        });

        await tx.electionVoter.deleteMany({
          where: {
            votingId: input.votingId,
          },
        });

        if (panelIds.length > 0) {
          await tx.candidatesOnPanels.deleteMany({
            where: {
              panelId: {
                in: panelIds,
              },
            },
          });

          await tx.panel.deleteMany({
            where: {
              id: {
                in: panelIds,
              },
            },
          });
        }

        if (candidateIds.length > 0) {
          await tx.candidate.deleteMany({
            where: {
              id: {
                in: candidateIds,
              },
            },
          });
        }

        await tx.voting.delete({
          where: {
            id: input.votingId,
          },
        });

        if (voting.isActive) {
          const fallbackVoting = await tx.voting.findFirst({
            orderBy: {
              createdAt: "desc",
            },
          });

          if (fallbackVoting) {
            await tx.voting.update({
              where: {
                id: fallbackVoting.id,
              },
              data: {
                isActive: true,
              },
            });
          }
        }

        return voting;
      });

      return deletedVoting;
    } catch (error) {
      console.log("🚀 ~ deleteVoting ~ error:", error);

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

export const clearVotingVoters = publicProcedure
  .input(z.object({ votingId: z.number() }))
  .mutation(async ({ input }) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const voting = await tx.voting.findUnique({
          where: {
            id: input.votingId,
          },
          include: {
            Voters: true,
          },
        });

        if (!voting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Election not found.",
          });
        }

        const voterIds = voting.Voters.map((entry) => entry.voterId);

        await tx.vote.deleteMany({
          where: {
            votingId: input.votingId,
          },
        });

        const deletedRoster = await tx.electionVoter.deleteMany({
          where: {
            votingId: input.votingId,
          },
        });

        return {
          count: deletedRoster.count,
          voterIds,
        };
      });

      if (result.voterIds.length > 0) {
        const updatedDevices = onlineDevices.getDevices().map((device) =>
          device.voterId && result.voterIds.includes(device.voterId)
            ? {
                ...device,
                voterId: undefined,
              }
            : device
        );

        onlineDevices.setDevices(updatedDevices);
        eventEmitter.emit(EVENTS.CHANGE_DEVICE, updatedDevices);
      }

      return {
        count: result.count,
      };
    } catch (error) {
      console.log("🚀 ~ clearVotingVoters ~ error:", error);

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

export const getAll = publicProcedure.query(async () => {
  try {
    const votings = await prisma.voting.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        Votes: true,
        Panels: {
          include: {
            Candidates: {
              include: {
                Candidate: true,
              },
            },
          },
        },
        Voters: {
          include: {
            Voter: true,
          },
        },
      },
    });
    return votings;
  } catch (error) {
    console.log("🚀 ~ getAll ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const getOneVotingDetailed = publicProcedure.query(async () => {
  try {
    let voting = await prisma.voting.findFirst({
      where: {
        isActive: true,
      },
      include: {
        Votes: true,
        Panels: {
          include: {
            Candidates: {
              include: {
                Candidate: true,
              },
            },
          },
        },
        Voters: {
          include: {
            Voter: true,
          },
        },
      },
    });

    if (!voting) {
      voting = await prisma.voting.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          Votes: true,
          Panels: {
            include: {
              Candidates: {
                include: {
                  Candidate: true,
                },
              },
            },
          },
          Voters: {
            include: {
              Voter: true,
            },
          },
        },
      });
    }

    return voting;
  } catch (error) {
    console.log("🚀 ~ getOneVoting ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});
