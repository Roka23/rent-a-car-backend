import express from 'express';
import Reservation from '../models/Reservation'; // Import your Reservation model
import authenticate from '../middleware/authMiddleware';
import isAdmin from '../middleware/adminMiddleware';
import dotenv from 'dotenv';
import Car from '../models/Car';
import Statistics from '../models/Statistics';

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Reserve a car
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carId:
 *                 type: string
 *               userId:
 *                 type: string
 *               totalCost:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { userId, carId, startDate, endDate, totalCost } = req.body;

        const car = await Car.findById(carId);
        if (!car) return res.status(404).json({ error: 'Car not found!' });

        // Create a new reservation with status "pending"
        const newReservation = new Reservation({
            carId,
            userId,
            startDate,
            endDate,
            status: 'pending',
            totalCost
        });

        await newReservation.save();

        const reservationDate = new Date(startDate).toISOString().split('T')[0];
        const newStats = new Statistics({
            date: reservationDate,
            revenue: totalCost,
            paymentStatus: 'pending',
            reservationId: newReservation._id
        });

        await newStats.save();

        res.status(201).json({ message: 'Reservation request created successfully. Waiting for admin approval.', reservation: newReservation });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reservations/{id}/approve:
 *   patch:
 *     summary: Approve a pending reservation (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation approved successfully
 *       404:
 *         description: Reservation not found
 */
router.patch('/:id/approve', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending reservations can be approved' });
        }

        const car = await Car.findById(reservation.carId);
        if (!car) return res.status(404).json({ error: 'Car not found!' });
        if (car.status !== 'available') return res.status(400).json({ error: 'Car is not available!' });

        reservation.status = 'confirmed';
        await reservation.save();

        const statistics = await Statistics.findOne({ reservationId: reservation._id });
        if (statistics) {
            statistics.paymentStatus = 'confirmed';
            await statistics.save();
        }

        car.status = 'reserved';
        await car.save();

        res.status(200).json({ message: 'Reservation approved successfully', reservation });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reservations/{id}/reject:
 *   patch:
 *     summary: Reject a pending reservation (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation rejected successfully
 *       404:
 *         description: Reservation not found
 */
router.patch('/:id/reject', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending reservations can be rejected' });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        await Reservation.deleteOne({ _id: reservation._id })

        const deleteResult = await Statistics.deleteOne({ reservationId: reservation._id })
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'No statistics found for this reservation' });
        }

        res.status(200).json({ message: 'Reservation rejected successfully', reservation });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});



/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reservations
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, isAdmin, async (req, res) => {
    try {
        const reservations = await Reservation.find().populate('carId').populate('userId');
        res.status(200).json(reservations);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reservations/ongoing:
 *   get:
 *     summary: Get all ongoing reservations
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of ongoing reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/ongoing', authenticate, isAdmin, async (req, res) => {
    try {
        const today = new Date();

        // Fetch reservations that are ongoing
        const ongoingReservations = await Reservation.find({
            status: { $in: ['confirmed'] },
            startDate: { $lte: today.toISOString() },
            endDate: { $gte: today.toISOString() }
        })
            .populate('carId') // Populate car details
            .populate('userId'); // Populate user details

        res.status(200).json(ongoingReservations);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reservations/getReservedDates/{carId}:
 *   get:
 *     summary: Get all reservation ranges for a specific car
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the car
 *     responses:
 *       200:
 *         description: A list of reservation date ranges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     description: The start date of the reservation
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     description: The end date of the reservation
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */
router.get('/getReservedDates/:carId', authenticate, async (req, res) => {
    try {
        const { carId } = req.params;
        const reservations = await Reservation.find({ carId: carId });

        const reservedDates = reservations.map(reservation => ({
            startDate: reservation.startDate,
            endDate: reservation.endDate,
        }));

        res.json(reservedDates);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/reservations/myReservations/{id}:
 *   get:
 *     summary: Get all reservations for the specified user
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 66ca49de53fc87b83c855768
 *     responses:
 *       200:
 *         description: List of reservations for the specified user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.get('/myReservations/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Find all reservations for the logged-in user
        const reservations = await Reservation.find({ userId: id })
            .populate('carId') // Optional: Populate car details
            .populate('userId'); // Optional: Populate user details

        res.status(200).json(reservations);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get a single reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation details
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findById(id).populate('carId').populate('userId');

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.status(200).json(reservation);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
