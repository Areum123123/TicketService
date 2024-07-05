import express, { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma.util';
import authMiddleware from '../middlewares/auth.middleware';

const performRouter = express.Router();


// 공연 등록 API
performRouter.post('/performance', authMiddleware, async (req: Request, res: Response, next:NextFunction) => {
    const { title, description, performancedate, price, venue, image, seats } = req.body;
  
    // 관리자 여부 확인 (현재 로그인된 사용자가 어드민인지 체크)
    const userId = (req as any).user.userId;
    const user = await prisma.users.findUnique({ where: { userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ status: 403, message: '권한이 없습니다.' });
    }
  
    try {

    
      const newPerformance = await prisma.performance.create({
        data: {
          title,
          description,
          performancedate,
          price,
          venue,
          image,
          seats, 
        },
      });
  
      res.status(201).json({ status: 201, message: '공연이 성공적으로 등록되었습니다.', performance: newPerformance });
    } catch (error: any) {
      console.error('공연 등록 에러:', error.message);
      next(error);
      // res.status(500).json({ status: 500, message: '서버 에러입니다. 잠시 후 다시 시도해주세요.' });
    }
  });
  
  export default performRouter;