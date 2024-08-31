import mongoose, { Schema, Document } from 'mongoose';

export interface ICar extends Document {
    make: string;
    carModel: string;
    year: string;
    status: 'available' | 'reserved' | 'maintenance' | 'rented';
    dailyRate: number;
    imageUrl: string;
    description: string;
    fuelType: 'electric' | 'hybrid' | 'diesel' | 'petrol';
    transmission: 'automatic' | 'manual'
    mileage: string;
    vehicleSize: 'small' | 'medium' | 'large';
}

const CarSchema: Schema = new Schema({
    make: { type: String, required: true },
    carModel: { type: String, required: true },
    year: { type: String, required: true },
    status: { type: String, enum: ['available', 'reserved', 'maintenance', 'rented'], default: 'available' },
    dailyRate: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    fuelType: { type: String, enum: ['electric', 'hybrid', 'diesel', 'petrol'], default: 'diesel', required: true },
    transmission: { type: String, enum: ['automatic', 'manual'], required: true },
    mileage: { type: String, required: true },
    vehicleSize: { type: String, enum: ['small', 'medium', 'large'], required: true },
}, { timestamps: true });

export default mongoose.model<ICar>('Car', CarSchema);
