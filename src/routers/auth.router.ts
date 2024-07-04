import express, { Request, Response } from 'express';
import { User } from '../models/Users'; // 예시로 만든 User 모델 import


const authRouter = express.Router();

const users: User[] = []; // 가짜 데이터베이스 대신 사용하는 배열 예시

// 회원가입 API
authRouter.post('/sign-up', (req: Request, res: Response) => {
  try {
    const { name, email, password, passwordConfirm, address } = req.body;

    // 필수 데이터 validation
    if (!email || !password ||!passwordConfirm || !name || !address) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    // 이메일 중복 체크 (가짜 데이터베이스에서)
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: '이미 등록된 이메일 주소입니다.' });
    }

    // 회원가입 처리
    const newUser: User = {
      userId: users.length + 1,
      email,
      password, // 실제로는 해싱 처리가 필요
      name,
      address,
      point: 1000000, //회원가입시 100만포인트 지급
    };

    users.push(newUser); // 가짜 데이터베이스에 추가 (실제로는 데이터베이스 연결 필요)

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: newUser,
    });
  } catch (error: any) { // 여기서 any를 사용해도 돼요
    console.error('회원가입 에러:', error.message); // 여기서는 타입스크립트가 오류를 발생하지 않습니다.
    res.status(500).json({ message: '서버 에러입니다. 잠시 후 다시 시도해주세요.' });
  }
});




export default authRouter;