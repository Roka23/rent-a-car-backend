import mongoose, { Schema, Document } from 'mongoose';

export interface IStatistics extends Document {
    date: Date;
    revenue: number;
    paymentStatus: 'pending' | 'confirmed' | 'cancelled'
    reservationId: string;
}

const StatisticsSchema: Schema = new Schema({
    date: { type: Date, required: true },
    revenue: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], required: true },
    reservationId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IStatistics>('Statistics', StatisticsSchema);
