import { createRouter } from './context';
import { z } from 'zod';

export const gameRouter = createRouter().query('getGames', {
  input: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    team1: z.string().optional(),
    team2: z.string().optional(),
  }),
  async resolve({ input, ctx }) {
    console.log(input);
    return await ctx.prisma.game.findMany({
      where: {
        OR: [
          {
            date: {
              gte: input.startDate,
              lte: input.endDate,
            },
            homeTeam: {
              equals: input.team1,
            },
            awayTeam: {
              equals: input.team2,
            },
          },
          {
            date: {
              gte: input.startDate,
              lte: input.endDate,
            },
            homeTeam: {
              equals: input.team2,
            },
            awayTeam: {
              equals: input.team1,
            },
          },
        ],
      },
    });
  },
});
