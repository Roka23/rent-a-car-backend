import express from 'express';
import Review from '../models/Review';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               carId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { userId, carId, rating, comment } = req.body;

        const newReview = new Review({
            userId,
            carId,
            rating,
            comment,
        });

        await newReview.save();
        res.status(201).json({ message: 'Review created successfully', review: newReview });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reviews/car/{carId}:
 *   get:
 *     summary: Get reviews for a car
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the car to get reviews for
 *     responses:
 *       200:
 *         description: A list of reviews for the car
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       404:
 *         description: Car not found
 */
router.get('/car/:carId', async (req, res) => {
    try {
        const reviews = await Review.find({ carId: req.params.carId })
            .populate('userId', 'username');
        if (!reviews) return res.status(404).json({ error: 'No reviews found for this car' });

        res.status(200).json(reviews);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get reviews by a user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to get reviews for
 *     responses:
 *       200:
 *         description: A list of reviews by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId })
            .populate('carId', 'make carModel imageUrl'); // Populate carId field with car details
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 *       400:
 *         description: Bad request
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.findByIdAndUpdate(req.params.id, { rating, comment }, { new: true });

        if (!review) return res.status(404).json({ error: 'Review not found' });

        res.status(200).json({ message: 'Review updated successfully', review });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) return res.status(404).json({ error: 'Review not found' });

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
