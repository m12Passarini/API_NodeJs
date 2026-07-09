import 'dotenv/config';
import { createError } from './error.js';

const getValidKeys = () => {
  return (process.env.API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
};

export const authMiddleware = (req, res, next) => {
  const key = req.headers['x-api-key'];
  const validKeys = getValidKeys();

  if (!key) return next(createError(400, 'api key required'));

  if (!validKeys.includes(key)) return next(createError(401, 'invalid api key'));

  req.key = key;
  next();
};