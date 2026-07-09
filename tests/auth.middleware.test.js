import { describe, expect, it, vi } from 'vitest';
import { authMiddleware } from '../middleware/auth.js';
import { createError } from '../middleware/error.js';

describe('authMiddleware', () => {
  it('calls next with a 400 error when API key is missing', () => {
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(createError(400, 'api key required'));
  });

  it('calls next with a 401 error when API key is invalid', () => {
    process.env.API_KEYS = 'valid-key';
    const req = { headers: { 'x-api-key': 'invalid-key' } };
    const res = {};
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(createError(401, 'invalid api key'));
  });

  it('attaches the API key and calls next without errors when valid', () => {
    process.env.API_KEYS = 'valid-key';
    const req = { headers: { 'x-api-key': 'valid-key' } };
    const res = {};
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(req.key).toBe('valid-key');
    expect(next).toHaveBeenCalledWith();
  });
});
