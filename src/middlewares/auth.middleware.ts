import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.util';

export default async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.headers['authorization'];
    if (!authorization) throw new Error('인증 정보가 없습니다.');

    const [tokenType, token] = authorization.split(' ');
    if (tokenType !== 'Bearer')
      throw new Error('지원하지 않는 인증 방식입니다.');

    const decodedToken = jwt.verify(token as string, process.env.ACCESS_TOKEN_SECRET_KEY as string) as { userId: string };
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) {
      res.clearCookie('authorization');
      throw new Error('인증 정보와 일치하는 사용자가 없습니다.');
    }

    (req as any).user = user; // 사용자 객체를 요청에 추가

    next();
  } catch (err: any) {
    res.clearCookie('authorization');

    switch (err.name) {
      case 'TokenExpiredError':
        res.status(401).json({ message: '인증 정보가 만료되었습니다.' });
        break;
      case 'JsonWebTokenError':
        res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });
        break;
      default:
        res.status(401).json({ message: err.message ?? '인증 정보가 유효하지 않습니다.' });
        break;
    }
  }
}
