import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";

export const getAllVoters = publicProcedure.query(async () => {
  try {
    const voter = await prisma.voter.findMany({
      orderBy: {
        voterId: "asc",
      },
    });

    return voter;
  } catch (error) {
    console.log("🚀 ~ getAllVoters ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const getVoterById = publicProcedure
  .input(z.object({ voterId: z.number() }))
  .query(async ({ input }) => {
    try {
      return prisma.voter.findUnique({
        where: {
          voterId: input.voterId,
        },
      });
    } catch (error) {
      console.log("🚀 ~ getVoterById ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

const voterImportSchema = z.object({
  voterId: z.number(),
  firstAndMiddleName: z.string(),
  lastName: z.string(),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  phone: z.string(),
  yob: z.number(),
  permanentAddress: z.string(),
  comments: z.string().optional(),
  extraFields: z.record(z.string()).optional(),
});

export const importVoters = publicProcedure
  .input(
    z.object({
      votingId: z.number(),
      voters: z.array(voterImportSchema).min(1),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const CHUNK_SIZE = 250;
      let importedCount = 0;

      for (let index = 0; index < input.voters.length; index += CHUNK_SIZE) {
        const chunk = input.voters.slice(index, index + CHUNK_SIZE);

        await prisma.$transaction(
          async (tx) => {
            for (const voter of chunk) {
              const {
                voterId,
                firstAndMiddleName,
                lastName,
                streetAddress,
                city,
                state,
                phone,
                yob,
                permanentAddress,
                comments,
                extraFields,
              } = voter;

              await tx.voter.upsert({
                where: {
                  voterId,
                },
                create: {
                  voterId,
                  firstAndMiddleName,
                  lastName,
                  streetAddress,
                  city,
                  state,
                  phone,
                  yob,
                  permanentAddress,
                  comments,
                },
                update: {
                  firstAndMiddleName,
                  lastName,
                  streetAddress,
                  city,
                  state,
                  phone,
                  yob,
                  permanentAddress,
                  comments,
                },
              });

              await tx.electionVoter.upsert({
                where: {
                  votingId_voterId: {
                    votingId: input.votingId,
                    voterId,
                  },
                },
                create: {
                  votingId: input.votingId,
                  voterId,
                  extraFields,
                } as any,
                update: {
                  extraFields,
                } as any,
              });
            }
          },
          {
            timeout: 20000,
            maxWait: 10000,
          }
        );

        importedCount += chunk.length;
      }

      return {
        count: importedCount,
      };
    } catch (error) {
      console.log("🚀 ~ importVoters ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });
