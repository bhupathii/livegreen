import { app, startServer } from '../server.js';

// Initialize the database connection when the function starts
let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await startServer();
    initialized = true;
  }
  return app(req, res);
}
