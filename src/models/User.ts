import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    profile: {
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
    };
    reservedCars: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
    },
    reservedCars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
