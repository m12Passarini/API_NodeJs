import express from 'express';
import userRoutes from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

app.use(express.json());

app.use(authMiddleware);

app.use('/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;