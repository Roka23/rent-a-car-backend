import express from 'express';
import userRoutes from './routes/userRoutes';
import carRoutes from './routes/carRoutes';
import reservationRoutes from './routes/reservationRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import reviewRoutes from './routes/reviewRoutes';
import setupSwagger from './swagger';
import connectDB from './config/db';
import dotenv from 'dotenv';
import './cronJobs';
import cors from 'cors'

const app = express();

app.use(cors());

// Middleware
app.use(express.json());

dotenv.config();

// Setup Swagger
setupSwagger(app);

// Images
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/statistics', statisticsRoutes)
app.use('/api/reviews', reviewRoutes)

// Connect to MongoDB
connectDB();

export default app;
