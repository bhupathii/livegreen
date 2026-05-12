import { app, startServer } from '../server.js';

let initialized = false;

export default async function handler(req: any, res: any) {
  try {
    if (!initialized) {
      console.log('Initializing Vercel Serverless Function...');
      await startServer();
      initialized = true;
    }
    return app(req, res);
  } catch (error: any) {
    console.error('CRITICAL_ERROR in Serverless Handler:', error.message);
    res.status(500).json({ 
      error: 'Server Initialization Failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
