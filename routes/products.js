import { Router } from 'express';
import { createError } from '../middleware/error.js';
import pool from '../db/db.js';

const router = Router();

const handleRouteError = (err, next) => {
  if (err && err.status) {
    return next(err);
  }

  return next(createError(500, 'Internal server error'));
};

const validateProductPayload = (payload) => {
  const { name, description, price, quantity } = payload;

  return (
    name !== undefined &&
    name !== '' &&
    description !== undefined &&
    description !== '' &&
    price !== undefined &&
    price !== null &&
    quantity !== undefined &&
    quantity !== null
  );
};

router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, quantity } = req.body;

    if (!validateProductPayload(req.body)) {
      return next(createError(400, 'name, description, price, and quantity are required'));
    }

    const productResult = await pool.query(
      'INSERT INTO products (name, description, price, quantity, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [name, description, price, quantity],
    );

    const product = productResult.rows[0];

    await pool.query(
      'INSERT INTO inventory_movements (product_id, type, quantity, reason, date_movement) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      [product.id, 'initial', product.quantity, 'Initial stock'],
    );

    res.status(201).json(product);
  } catch (err) {
    handleRouteError(err, next);  
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    handleRouteError(err, next);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const { id, name, description, price, quantity, reason } = req.body;

    if (!id || !validateProductPayload(req.body)) {
      return next(createError(400, 'Id, name, description, price, and quantity are required'));
    }

    const existingProductResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (existingProductResult.rowCount === 0) {
      return next(createError(404, 'Product not found'));
    }

    const existingProduct = existingProductResult.rows[0];

    const updateResult = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, quantity = $4 WHERE id = $5 RETURNING *',
      [name, description, price, quantity, id],
    );

    if (updateResult.rowCount === 0) {
      return next(createError(404, 'Product not found'));
    }

    const deltaQuantity = Number(quantity) - Number(existingProduct.quantity);

    if (deltaQuantity !== 0) {
      await pool.query(
        'INSERT INTO inventory_movements (product_id, type, quantity, reason, date_movement) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [id, deltaQuantity > 0 ? 'entry' : 'exit', Math.abs(deltaQuantity), reason || 'Stock adjustment'],
      );
    }

    res.status(200).json(updateResult.rows[0]);
  } catch (err) {
    handleRouteError(err, next);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return next(createError(400, 'Id is required'));
    }

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return next(createError(404, 'Product not found'));
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    handleRouteError(err, next);
  }
});

export default router;
