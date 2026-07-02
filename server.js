// node --watch server.js

import app from './app.js';
import { dbConnection } from './db/dbConnection.js';

const port = 3000;

async function startServer() {
  try {
    await dbConnection();

    app.listen(port, () => {
      console.log(`Server hosting in http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Critical error when starting the server:', err.message);
    process.exit(1); 
  }
}

startServer();