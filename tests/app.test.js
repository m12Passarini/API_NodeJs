import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../db/db.js', () => ({
  default: {
    query: mockQuery,
  },
}));

const loadApp = async (apiKeys = 'valid-key') => {
  process.env.API_KEYS = apiKeys;
  vi.resetModules();
  const { default: app } = await import('../app.js');
  return app;
};

describe('Auth and users routes', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    delete process.env.API_KEYS;
  });

  it('returns 400 when the API key is missing', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/users')
      .send({ name: 'Maria', email: 'maria@email.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'api key required' });
  });

  it('returns 401 for an invalid API key', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/users')
      .set('x-api-key', 'invalid-key')
      .send({ name: 'Maria', email: 'maria@email.com' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'invalid api key' });
  });

  it('creates a user when the request is valid', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Maria', email: 'maria@email.com' }],
    });

    const response = await request(app)
      .post('/users')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Maria', email: 'maria@email.com' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1, name: 'Maria', email: 'maria@email.com' });
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      ['Maria', 'maria@email.com'],
    );
  });

  it('returns 400 when the email is missing', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/users')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Maria' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Name and email are required' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 400 when the email format is invalid', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/users')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Maria', email: 'maria.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid email format' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 404 when trying to update an inexistent user', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const response = await request(app)
      .put('/users')
      .set('x-api-key', 'valid-key')
      .send({ emailOriginal: 'missing@email.com', name: 'Maria', email: 'maria2@email.com' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  it('returns 404 when trying to delete an inexistent user', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const response = await request(app)
      .delete('/users')
      .set('x-api-key', 'valid-key')
      .send({ email: 'missing@email.com' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  it('returns 500 when the database fails', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockRejectedValueOnce(new Error('Conexão perdida'));

    const response = await request(app)
      .post('/users')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Maria', email: 'maria@email.com' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('lists users', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Maria', email: 'maria@email.com' }],
    });

    const response = await request(app)
      .get('/users')
      .set('x-api-key', 'valid-key');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Maria', email: 'maria@email.com' }]);
  });

  it('updates a user and returns the changed record', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 1, name: 'Maria', email: 'maria2@email.com' }],
    });

    const response = await request(app)
      .put('/users')
      .set('x-api-key', 'valid-key')
      .send({ emailOriginal: 'maria@email.com', name: 'Maria', email: 'maria2@email.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Maria', email: 'maria2@email.com' });
  });

  it('deletes a user', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Maria', email: 'maria@email.com' }],
    });

    const response = await request(app)
      .delete('/users')
      .set('x-api-key', 'valid-key')
      .send({ email: 'maria@email.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Maria', email: 'maria@email.com' });
  });
});
