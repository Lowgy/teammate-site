// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { teamRouter } from './teamRouter';
import { gameRouter } from './gameRouter';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('teams.', teamRouter)
  .merge('games.', gameRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
