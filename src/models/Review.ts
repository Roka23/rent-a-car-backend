import mongoose, { Schema, Document } from 'mongoose';

export interface ReviewDocument extends Document {
    userId: mongoose.Types.ObjectId;
    carId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ReviewDocument>('Review', ReviewSchema);
