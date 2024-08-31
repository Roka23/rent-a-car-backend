import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import dotenv from 'dotenv'

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

interface RequestWithUser extends Request {
    user?: any; // Adding user property to Request
}

const authenticate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    console.log("REQ HEADERS ", req.headers['authorization'])
    console.log("TOKEN ARRIVED ", token)

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET!);

        console.log("Successfully decoded ", decoded);
        req.user = await User.findById(decoded.userId).select('-password');

        console.log("Found user ", req.user)
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token here' });
    }
};

export default authenticate;
