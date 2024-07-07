import express, { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma.util';
import authMiddleware from '../middlewares/auth.middleware';

const performRouter = express.Router();


// 공연 등록 API
performRouter.post('/performance', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, performancedate, price, venue, image, seats, category } = req.body;

  // 관리자 여부 확인 (현재 로그인된 사용자가 어드민인지 체크)
  const userId = (req as any).user.userId;
  const user = await prisma.users.findUnique({ where: { userId } });
  if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ status: 403, message: '권한이 없습니다.' });
  }

 // 공연가격이 50000 포인트까지 가능
 if (price > 50000) {
    return res.status(400).json({ status: 400, message: '공연 상한금액은 50000포인트까지 가능합니다.' });
}

  try {
      // Performance 생성
      const newPerformance = await prisma.performance.create({
          data: {
              title,
              description,
              price,
              venue,
              image,
              seats,
              category,
              PerformanceDate: {
                  createMany: {
                      data: performancedate.map((date: string) => ({
                          performancedate: new Date(date)
                      }))
                  }
              }
          },
          include: {
              PerformanceDate: true
          }
      });


       // 생성된 공연 정보에서 필요한 필드만 선택하여 응답
       const { PerformanceId, createdAt, updatedAt, ...performanceInfo } = newPerformance;

       // PerformanceDate 배열에서 필요한 필드만 선택하여 응답
       const formattedPerformanceDate = newPerformance.PerformanceDate.map((date) => ({
            //   id: date.id,  //공연날짜데이터에 id표시
           performancedate: date.performancedate
       }));

       // 정리된 응답 객체 생성
       const response = {
           
        PerformanceId,
        ...performanceInfo,
        createdAt,
        updatedAt,
        PerformanceDate: formattedPerformanceDate
        
       };

      res.status(201).json({ status: 201, message: '공연이 성공적으로 등록되었습니다.',manager: userId, data: response });
    } catch (error: any) {
      console.error('공연 등록 에러:', error.message);
      next(error);
      
    }
  });



  //공연 조회 API [전체, 카테고리 별 조회]
  performRouter.get('/performance', async (req: Request, res: Response, next: NextFunction) =>{
    try {
        const performances = await prisma.performance.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                PerformanceDate: true
            }
        });

 // PerformanceDate 배열에서 날짜만 응답하게 수정(추가원할시 추가하면됨)
 const formattedPerformances = performances.map(performance => {
    return {
      ...performance,
      PerformanceDate: performance.PerformanceDate.map(date => ({
        performancedate: date.performancedate
      }))
    };
  });
    

        res.status(200).json({ status: 200, data: formattedPerformances });
    } catch (error: any) {
        console.error('공연 조회 에러:', error.message);
        next(error);
    }
  });

  // 카테고리 별 공연 조회 API
performRouter.get('/performance/category/:category', async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.params;
    try {
        const performances = await prisma.performance.findMany({
            where: {
                category: category.toUpperCase() as any
            },
            orderBy: { createdAt: 'desc' },//최신순
            include: {
                PerformanceDate: true
            }
        });

        // PerformanceDate 배열에서 날짜만 응답하게 수정(추가원할시 추가하면됨)
 const formattedPerformances = performances.map(performance => {
    return {
      ...performance,
      PerformanceDate: performance.PerformanceDate.map(date => ({
        performancedate: date.performancedate
      }))
    };
  });
    
        res.status(200).json({ status: 200, data: formattedPerformances });
    } catch (error: any) {
        console.error('카테고리 별 공연 조회 에러:', error.message);
        next(error);
    }
  });
  


 
//공연 예매하기 api
performRouter.post('/performance/:performanceId/book', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { performanceId } = req.params;
    const { userId } = (req as any).user;
    const { performancedate } = req.body;

    try {
        // 트랜잭션 시작
        await prisma.$transaction(async (prisma) => {
            // 공연 정보 조회
            const performance = await prisma.performance.findUnique({
                where: { PerformanceId: parseInt(performanceId) },
                include: { Booking: true, PerformanceDate: true }
            });

            if (!performance) {
                throw new Error('해당 공연을 찾을 수 없습니다.');
            }

            // 사용자 정보 조회
            const user = await prisma.users.findUnique({ where: { userId } });
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 공연 가격 확인 및 사용자 포인트 확인
            const price = performance.price;
            if (user.point < price) {
                throw new Error('포인트가 부족하여 예매할 수 없습니다.');
            }

            // 선택한 공연 날짜가 유효한지 확인
            const validPerformanceDates = performance.PerformanceDate.map(date => date.performancedate.getTime());
            const selectedPerformanceDate = new Date(performancedate).getTime();
            if (!validPerformanceDates.includes(selectedPerformanceDate)) {
                throw new Error('선택한 날짜는 공연 일정에 포함되지 않습니다.');
            }

            // 선택한 공연 날짜에 대한 예약된 좌석 수 계산 및 만석 여부 확인
            const bookedSeats = performance.Booking
                .filter(booking => booking.performancedate.getTime() === selectedPerformanceDate)
                .map(booking => booking.seatNumber);

            if (bookedSeats.length >= performance.seats) {
                throw new Error('이미 만석인 공연입니다. 예매할 수 없습니다.');
            }

            // 가능한 좌석 번호 목록 생성
            const totalSeats = performance.seats;
            const rows = ['A', 'B', 'C', 'D', 'E'];
            const seatsPerRow = Math.ceil(totalSeats / rows.length);
            const allSeats: string[] = [];
            rows.forEach(row => {
                for (let i = 1; i <= seatsPerRow; i++) {
                    allSeats.push(`${row}${i}`);
                }
            });

            // 가능한 좌석에서 이미 예약된 좌석 제외
            const availableSeats = allSeats.filter(seat => !bookedSeats.includes(seat));
            const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];

            // 예약 정보 생성
            const bookedAt = new Date();
            const newBooking = await prisma.booking.create({
                data: {
                    UserId: userId,
                    PerformanceId: parseInt(performanceId),
                    bookingDate: bookedAt,
                    seatNumber: randomSeat,  // 랜덤 좌석 번호 설정
                    performancedate: new Date(performancedate)
                }
            });

            // 사용자 포인트 차감
            await prisma.users.update({
                where: { userId },
                data: { point: { decrement: price } }
            });

           
            // 예약 후 해당 공연의 예약된 좌석 수 갱신
           const seatsReserved = await prisma.booking.count({
            where: { PerformanceId: parseInt(performanceId) }
        });

         // Performance 테이블에서 예약된 좌석 수 갱신
         await prisma.performance.update({
            where: { PerformanceId: parseInt(performanceId) },
            data: { seatsReserved }
        });

            // 예약 완료 후 응답
            res.status(201).json({
                status: 201,
                message: '공연 예매가 성공적으로 완료되었습니다.',
                bookingId: newBooking.bookingId,
                date: {
                    title: performance.title,
                    performancedate: performancedate,
                    venue: performance.venue,
                    price: performance.price,
                    seatNumber: randomSeat  // 예약된 좌석 번호 응답
                },
                bookedAt: bookedAt.toISOString()
            });
        });
    } catch (error: any) {
        console.error('예매하기 에러:', error.message);
        next(error);
    }
});

//공연 상세보기 API
performRouter.get('/performance/:performanceId', async (req: Request, res: Response, next: NextFunction) => {
    const { performanceId } = req.params;

    try {
        // 공연 정보 조회
        const performance = await prisma.performance.findUnique({
            where: {
                PerformanceId: parseInt(performanceId)
            },
            include: {
                PerformanceDate: true,
                Booking: true
            }
        });

        if (!performance) {
            return res.status(404).json({ status: 404, message: '해당 공연을 찾을 수 없습니다.' });
        }

        // 예약된 좌석 수 계산
        const seatsReservedByDate = performance.PerformanceDate.map(date => {
            const bookedSeats = performance.Booking
                .filter(booking => booking.performancedate.getTime() === date.performancedate.getTime())
                .map(booking => booking.seatNumber);

            const availableSeats = performance.seats - bookedSeats.length;
            return {
                performancedate: date.performancedate,
                availableSeats: availableSeats
            };
        });

        // PerformanceDate 배열에서 날짜만 응답
        // const formattedPerformanceDate = performance.PerformanceDate.map(date => ({
        //     performancedate: date.performancedate
        // }));

        // 정리된 응답 객체 생성
        const response = {
            PerformanceId: performance.PerformanceId,
            title: performance.title,
            description: performance.description,
            price: performance.price,
            venue: performance.venue,
            category: performance.category,
            PerformanceDate: seatsReservedByDate,  // 각 날짜별 남은 좌석 수 정보 추가
            image: performance.image
            // seats: performance.seats, //총좌석
            // createdAt: performance.createdAt,
            // updatedAt: performance.updatedAt,
            
          
        };

        res.status(200).json({ status: 200, data: response });
    } catch (error: any) {
        console.error('공연 상세 조회 에러:', error.message);
        next(error);
    }
});



// 예매 목록 확인 API
performRouter.get('/users/bookings', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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


  export default performRouter;













  // 공연명으로 검색하는 API
// performRouter.get('/performance/search', async (req: Request, res: Response, next: NextFunction) => {
//     const { query } = req.query; // query 파라미터에서 검색어 가져오기
//     try {
//       const performances = await prisma.performance.findMany({
//         where: {
//           title: {
//             contains: query as string // 공연명에 검색어 포함된 경우 필터링
//           }
//         },
//         orderBy: {
//           createdAt: 'desc' // 최신순으로 정렬
//         },
//         include: {
//           PerformanceDate: true
//         }
//       });
  
//       // PerformanceDate 배열에서 날짜만 응답하게 수정
//       const formattedPerformances = performances.map(performance => {
//         return {
//           ...performance,
//           PerformanceDate: performance.PerformanceDate.map(date => ({
//             performancedate: date.performancedate
//           }))
//         };
//       });
  
//       res.status(200).json({ status: 200, data: formattedPerformances });
//     } catch (error: any) {
//       console.error('공연명 검색 에러:', error.message);
//       next(error);
//     }
//   });