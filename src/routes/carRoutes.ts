import express from 'express';
import Car from '../models/Car'; // Import the Car model
import authenticate from '../middleware/authMiddleware'; // Import authentication middleware
import isAdmin from '../middleware/adminMiddleware'; // Import admin authorization middleware
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of all cars
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const cars = await Car.find();
        res.status(200).json(cars);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the directory to save the uploaded file
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});

const upload = multer({ storage });

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create a new car (Admin only)
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               carModel:
 *                 type: string
 *               description:
 *                 type: string
 *               year:
 *                 type: integer
 *               dailyRate:
 *                 type: number
 *               status:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               transmission:
 *                 type: string
 *               mileage:
 *                 type: number
 *               vehicleSize:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Car created successfully
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post('/', authenticate, isAdmin, upload.single('imageUrl'), async (req: Request, res: Response) => {
    try {
        const { make, carModel, description, year, dailyRate, status, fuelType, transmission, mileage, vehicleSize } = req.body;
        const imageUrl = req.file ? path.basename(req.file.path) : '';

        const newCar = new Car({
            make,
            carModel,
            description,
            year,
            dailyRate,
            status,
            fuelType,
            transmission,
            mileage,
            vehicleSize,
            imageUrl
        });

        await newCar.save();
        res.status(201).json({ message: 'Car created successfully', car: newCar });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/similar/:carId', async (req: Request, res: Response) => {
    try {
        const car = await Car.findById(req.params.carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const similarCars = await Car.find({
            _id: { $ne: car._id }, // Exclude the current car
            $or: [
                { vehicleSize: car.vehicleSize },
                { dailyRate: { $gte: car.dailyRate - 50, $lte: car.dailyRate + 50 } } // Adjust the price range as needed
            ]
        }).limit(5); // Adjust the limit as needed

        res.json(similarCars);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/makes', async (req: Request, res: Response) => {
    try {
        const makes = await Car.distinct('make');
        res.status(200).json(makes);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/cars/search:
 *   get:
 *     summary: Search for cars
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term for car model, brand, etc.
 *     responses:
 *       200:
 *         description: List of cars matching the search term
 *       400:
 *         description: Bad request
 */
router.get('/search', async (req, res) => {
    try {
        console.log("Received query:", req.query.query);

        const { query } = req.query;

        if (typeof query !== 'string') {
            return res.status(400).json({ error: 'Query must be a string' });
        }

        // Simple search logic (case-insensitive)
        const cars = await Car.find({
            $or: [
                { carModel: { $regex: query, $options: 'i' } },
                { make: { $regex: query, $options: 'i' } },
            ]
        });

        res.status(200).json(cars);
    } catch (err: any) {
        console.error("Error:", err);
        res.status(400).json({ error: err.message });
    }
});
/**
 * @swagger
 * /api/cars/filter:
 *   get:
 *     summary: Filter cars based on criteria
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Filter by car make
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Maximum price
 *     responses:
 *       200:
 *         description: List of cars matching the filter criteria
 *       400:
 *         description: Bad request
 */
router.get('/filter', async (req, res) => {
    try {
        const { make, priceMin, priceMax } = req.query;

        // Build query object
        const filter: any = {};
        if (make) filter.make = make;
        if (priceMin || priceMax) filter.dailyRate = {};
        if (priceMin) filter.dailyRate.$gte = Number(priceMin);
        if (priceMax) filter.dailyRate.$lte = Number(priceMax);

        const cars = await Car.find(filter);

        res.status(200).json(cars);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get a single car by ID
 *     tags: [Cars]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Car ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.status(200).json(car);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     summary: Update a car (Admin only)
 *     tags: [Cars]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Car ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               carModel:
 *                 type: string
 *               year:
 *                 type: integer
 *               dailyRate:
 *                 type: number
 *               status:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               transmission:
 *                 type: string
 *               mileage:
 *                 type: number
 *               vehicleSize:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Car not found
 */
router.put('/:id', authenticate, isAdmin, async (req: Request, res: Response) => {
    try {
        const { make, carModel, year, dailyRate, status, fuelType, transmission, mileage, vehicleSize, description } = req.body;
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { make, carModel, year, dailyRate, status, fuelType, transmission, mileage, vehicleSize, description },
            { new: true }
        );

        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.status(200).json({ message: 'Car updated successfully', car });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});


/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     summary: Delete a car (Admin only)
 *     tags: [Cars]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Car ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Car not found
 */
router.delete('/:id', authenticate, isAdmin, async (req: Request, res: Response) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.status(200).json({ message: 'Car deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
