import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
    carId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    totalCost: number;
}

const ReservationSchema: Schema = new Schema({
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    totalCost: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IReservation>('Reservation', ReservationSchema);
