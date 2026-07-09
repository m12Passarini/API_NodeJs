import express from 'express';
import productRoutes from './routes/products.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

app.use(express.json());

app.use(authMiddleware);

app.use('/products', productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;