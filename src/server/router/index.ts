// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { teamRouter } from './teamRouter';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('teams.', teamRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
