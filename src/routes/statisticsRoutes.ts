// routes/statisticsRoutes.ts

import express, { Request, Response } from 'express';
import Statistics from '../models/Statistics';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();


/**
 * @swagger
 * /api/statistics/overview:
 *   get:
 *     summary: Get total revenue overview
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date to filter revenue. If not provided, returns total revenue for all dates.
 *     responses:
 *       200:
 *         description: Total revenue overview
 *       400:
 *         description: Bad request
 */
router.get('/overview', authenticate, async (req: Request, res: Response) => {
    try {
        const { date } = req.query;

        let match: any = {};

        if (date && typeof date === 'string') {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1); // End date is the start date + 1 day

            match.date = { $gte: startDate, $lt: endDate };
        }

        // Aggregate revenue
        const result = await Statistics.aggregate([
            { $match: match },
            { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }
        ]);

        const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

        res.status(200).json({ totalRevenue });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});


/**
 * @swagger
 * /api/statistics:
 *   get:
 *     summary: Get statistics overview (Admin only)
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Statistics overview
 *       403:
 *         description: Forbidden
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const statistics = await Statistics.find();
        res.status(200).json(statistics);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/statistics/date:
 *   get:
 *     summary: Filter statistics by date range (Admin only)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for the filter range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for the filter range
 *     responses:
 *       200:
 *         description: Filtered statistics by date range
 *       400:
 *         description: Bad request
 */
router.get('/date', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query as { startDate: string, endDate: string };

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const statistics = await Statistics.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        res.status(200).json(statistics);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
