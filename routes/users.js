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

export default router;