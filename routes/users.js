import { Router } from 'express';
import { createError } from '../middleware/error.js';
import pool from '../db/db.js';

const router = Router();

router.post("/", async (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return next(createError(400, "Name and email are required"));
        }

        const query = "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *";
        const values = [name, email];

       const result =  await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
});

router.put("/", async (req, res, next) => {
    try {
        const { emailOriginal, name, email } = req.body;

        if (!emailOriginal || !name || !email) {
            return next(createError(400, "emailOriginal, name, and email are required"));
        }

        const query = "UPDATE users SET name = $1, email = $2 WHERE email = $3 RETURNING *;";
        const values = [name, email, emailOriginal];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return next(createError(404, "User not found"));
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

router.delete("/", async (req, res, next) => {
    try {
         const { email } = req.body;

        if (!email) {
            return next(createError(400, "Email is required"));
        }

        const query = "DELETE FROM users WHERE email = $1 RETURNING *;";
        const values = [email];

       const result =  await pool.query(query, values);

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
})

export default router;