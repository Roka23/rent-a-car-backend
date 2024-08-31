// cronJobs.ts
import cron from 'node-cron';
import Car from './models/Car';
import Reservation from './models/Reservation';

// Scheduled job to check reservations and update car status
cron.schedule('0 * * * *', async () => { // Runs every hour
    const now = new Date();
    try {
        // Find reservations that have ended
        const reservations = await Reservation.find({
            endDate: { $lt: now },
            status: 'confirmed', // Assume you have a status field for active reservations
        });

        for (const reservation of reservations) {
            const car = await Car.findById(reservation.carId);
            if (car) {
                // Check if there are no overlapping reservations
                const overlappingReservations = await Reservation.find({
                    carId: car._id,
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                });

                if (overlappingReservations.length === 0) {
                    // Set car status to 'available'
                    car.status = 'available';
                    await car.save();
                }
            }

            // Optionally update reservation status if needed
            reservation.status = 'completed'; // Update reservation status
            await reservation.save();
        }
    } catch (err) {
        console.error('Error updating car statuses:', err);
    }
});
