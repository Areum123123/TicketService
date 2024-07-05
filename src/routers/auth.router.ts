import express, { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import authMiddleware from '../middlewares/auth.middleware';
import jwt from 'jsonwebtoken';


const prisma = new PrismaClient();
const authRouter = express.Router();



// 회원가입 API
authRouter.post('/sign-up', async(req: Request, res: Response) => {
  try {
    const { name, email, password, passwordConfirm, address } = req.body;

    // 필수 데이터 validation
    if (!email || !password ||!passwordConfirm || !name || !address) {
      return res.status(400).json({status:400, message: '모든 필드를 입력해주세요.' });
    }

    //비밀번호와 비밀번호확인 일치
    if(password !== passwordConfirm){
      return res.status(400).json({status:400, message:'입력 한 두 비밀번호가 일치하지 않습니다.'})
    }

    // 이메일 중복 체크 
    const existingUser = await prisma.users.findUnique({where:{email}})
    if (existingUser) {
      return res.status(400).json({status:400, message: '이미 등록된 이메일 주소입니다.' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.users.create({
      data: {
        email,
        password:hashedPassword, 
        name,
        address,
        point: 1000000,
      },
    }); 

    res.status(201).json({
      status:201,
      message: '회원가입이 완료되었습니다.',
      // user: newUser,
    });
  } catch (error: any) { // 여기서 any를 사용해도 돼요
    console.error('회원가입 에러:', error.message); // 여기서는 타입스크립트가 오류를 발생하지 않습니다.
    res.status(500).json({status:500, message: '서버 에러입니다. 잠시 후 다시 시도해주세요.' });
  }
});





//로그인 API
authRouter.post('/sign-in', async(req:Request, res:Response, next:NextFunction)=>{

  const{email, password} = req.body;

if(!email || !password){
  const missingFields = [];
    if (!email) {
      missingFields.push('이메일을');
    }
    if (!password) {
      missingFields.push('비밀번호를');
    }

  return res.status(400).json({
    status:400,
    message:"${missingFields} 입력해 주세요."
  })
}
  // - **이메일 형식에 맞지 않는 경우** - “이메일 형식이 올바르지 않습니다.”
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 400,
      message: '이메일 형식이 올바르지 않습니다.',
    });
  }

  //이메일로 사용자 찾기
  const user = await prisma.users.findUnique({ where: { email } });
  if(!user){
    return res.status(401).json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
  }

 // 비밀번호 일치 여부 확인 (실제로는 해싱된 비밀번호와 비교해야 함)
 const passwordValid = await comparePassword(password, user.password);
 if (!passwordValid) {
   return res.status(401).json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
 }

   //사용자에게 jwt발급

   const accessToken = jwt.sign(
    {
      userId: user.userId,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY as jwt.Secret,
    { expiresIn: '12h' },
  );
  res.header('authorization', `Bearer ${accessToken}`)
 
  return res.status(200).json({
    status: 200,
    message: '로그인 성공했습니다.',
    accessToken: accessToken,
  });
});



//내 프로필 보기
authRouter.get('/myprofile',authMiddleware, async(req:Request, res:Response)=>{
 const userId  = (req as any).user.userId           //일단이렇게 하긴했는데 될지는 모르겠음       
const user = await prisma.users.findUnique({ 
  where: { userId },
  select:{
    userId: true,
    name: true,
    email: true,
    address: true,
    point:true,
    createdAt: true,
   
  }
 });      

  if (!user) {
    return res.status(404).json({ status: 404, message: '사용자를 찾을 수 없습니다.' });
  }



  // 사용자 프로필 반환
  res.status(200).json({ status: 200, messag: "사용자 프로필", date: user });
})


export default authRouter;