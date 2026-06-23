import { Router } from 'express';
import { createError } from '../middleware/error.js';

const router = Router();

const users = []; // futuro bd

router.post("/", (req, res, next) => {
    if (!req.body) {
        return next(createError(400, "A data is required"));
    }

    users.push(req.body);
    res.status(201).json(req.body);
});

router.get("/", (req, res) => {
    res.status(200).json(users);
});

export default router;