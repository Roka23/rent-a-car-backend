import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user; // Get user from request

    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};

export default isAdmin;
