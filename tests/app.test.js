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

describe('Auth and products routes', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    delete process.env.API_KEYS;
  });

  it('returns 400 when the API key is missing', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/products')
      .send({ name: 'Teclado', description: 'USB', price: 120, quantity: 10 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'api key required' });
  });

  it('returns 401 for an invalid API key', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/products')
      .set('x-api-key', 'invalid-key')
      .send({ name: 'Teclado', description: 'USB', price: 120, quantity: 10 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'invalid api key' });
  });

  it('creates a product and records the initial stock movement', async () => {
    const app = await loadApp('valid-key');
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Teclado', description: 'USB', price: '120.00', quantity: 10, created_at: '2026-07-09T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .post('/products')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Teclado', description: 'USB', price: 120, quantity: 10 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      name: 'Teclado',
      description: 'USB',
      price: '120.00',
      quantity: 10,
      created_at: '2026-07-09T00:00:00.000Z',
    });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('returns 400 when the required product fields are missing', async () => {
    const app = await loadApp('valid-key');

    const response = await request(app)
      .post('/products')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Teclado' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Name, description, price, and quantity are required' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 404 when trying to update an inexistent product', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await request(app)
      .put('/products')
      .set('x-api-key', 'valid-key')
      .send({ id: 99, name: 'Monitor', description: '24 polegadas', price: 500, quantity: 3 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Product not found' });
  });

  it('returns 404 when trying to delete an inexistent product', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const response = await request(app)
      .delete('/products')
      .set('x-api-key', 'valid-key')
      .send({ id: 99 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Product not found' });
  });

  it('returns 500 when the database fails', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockRejectedValueOnce(new Error('Conexão perdida'));

    const response = await request(app)
      .post('/products')
      .set('x-api-key', 'valid-key')
      .send({ name: 'Teclado', description: 'USB', price: 120, quantity: 10 });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('lists products', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Teclado', description: 'USB', price: '120.00', quantity: 10, created_at: '2026-07-09T00:00:00.000Z' }],
    });

    const response = await request(app)
      .get('/products')
      .set('x-api-key', 'valid-key');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Teclado', description: 'USB', price: '120.00', quantity: 10, created_at: '2026-07-09T00:00:00.000Z' }]);
  });

  it('updates a product and records a stock movement when the quantity changes', async () => {
    const app = await loadApp('valid-key');
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Teclado', description: 'USB', price: '120.00', quantity: 10, created_at: '2026-07-09T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'Teclado', description: 'USB', price: '130.00', quantity: 8, created_at: '2026-07-09T00:00:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .put('/products')
      .set('x-api-key', 'valid-key')
      .send({ id: 1, name: 'Teclado', description: 'USB', price: 130, quantity: 8, reason: 'Venda' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Teclado', description: 'USB', price: '130.00', quantity: 8, created_at: '2026-07-09T00:00:00.000Z' });
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it('deletes a product', async () => {
    const app = await loadApp('valid-key');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Teclado', description: 'USB', price: '120.00', quantity: 10, created_at: '2026-07-09T00:00:00.000Z' }],
    });

    const response = await request(app)
      .delete('/products')
      .set('x-api-key', 'valid-key')
      .send({ id: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Teclado', description: 'USB', price: '120.00', quantity: 10, created_at: '2026-07-09T00:00:00.000Z' });
  });
});
