import express from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticate from '../middleware/authMiddleware';
import dotenv from 'dotenv';
import isAdmin from '../middleware/adminMiddleware';

dotenv.config();

const router = express.Router();

// Environment variable for JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profile: {
                firstName,
                lastName,
                phone,
                address,
            },
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Invalid email or password' });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(404).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET!,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   profile:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       address:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Get user profile information
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     address:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/profile/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   put:
 *     summary: Update user profile information
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/profile/:userId', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone, address } = req.body;
        const { userId } = req.params;
        // Find the user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (firstName) user.profile.firstName = firstName;
        if (lastName) user.profile.lastName = lastName;
        if (phone) user.profile.phone = phone;
        if (address) user.profile.address = address;

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/grantAdmin/{id}:
 *   put:
 *     summary: Grant admin access to a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to grant admin access to
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put('/grantAdmin/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: 'admin' },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ message: 'Admin access granted successfully', user });
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * @swagger
 * /api/users/revokeAdmin/{id}:
 *   put:
 *     summary: Revoke admin access from a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to revoke admin access from
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put('/revokeAdmin/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: 'user' },
            { new: true }
        )

        if (!user) return res.status(404).json({ error: 'User not found' })

        res.status(200).json({ message: 'Admin access revoked sucessfully', user })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router;
