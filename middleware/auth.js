import 'dotenv/config';
import { createError } from './error.js';

const validKeys = process.env.API_KEYS.split(',');

export const authMiddleware = (req, res, next) => {
  var key = req.headers['x-api-key'];

  if (!key) return next(createError(400, 'api key required'));

  if (!validKeys.includes(key)) return next(createError(401, 'invalid api key'))

  req.key = key;
  next();
};