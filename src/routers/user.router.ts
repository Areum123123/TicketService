
import express, { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma.util';
import authMiddleware from '../middlewares/auth.middleware';

const userRouter = express.Router();

// 예매 목록 확인 API
userRouter.get('/users/bookings', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = (req as any).user;

    try {
        // 사용자의 예매 목록 조회
        const bookings = await prisma.booking.findMany({
            where: { UserId: userId },
            orderBy: { bookingDate: 'desc' },
            include: {
                Performance: true
            }
        });

        // 예매 목록 형식 변환
        const formattedBookings = bookings.map(booking => ({
            bookingId: booking.bookingId,
            performanceTitle: booking.Performance.title,
            performancedate: booking.performancedate,
            venue: booking.Performance.venue,
            price: booking.Performance.price,
            seatNumber: booking.seatNumber,
            bookingDate: booking.bookingDate
        }));

        res.status(200).json({ status: 200, data: formattedBookings });
    } catch (error: any) {
        console.error('예매 목록 조회 에러:', error.message);
        next(error);
    }
});


  export default userRouter;