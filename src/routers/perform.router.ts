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