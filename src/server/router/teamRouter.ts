import { createRouter } from './context';

export const teamRouter = createRouter().query('getAll', {
  async resolve({ ctx }) {
    return await ctx.prisma.team.findMany();
  },
});
