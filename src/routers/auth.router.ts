import express, { NextFunction, Request, Response } from 'express';
import { User } from '../models/Users'; // 예시로 만든 User 모델 import
import { userinfo } from '../db/test.users.Database';


const authRouter = express.Router();

console.log(userinfo);


// 회원가입 API
authRouter.post('/sign-up', (req: Request, res: Response) => {
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

    // 이메일 중복 체크 (가짜 데이터베이스에서)
    const existingUser = userinfo.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({status:400, message: '이미 등록된 이메일 주소입니다.' });
    }

    // 회원가입 처리
    const newUser: User = {
      userId: userinfo.length + 1,
      email,
      password, // 실제로는 해싱 처리가 필요
      name,
      address,
      point: 1000000, //회원가입시 100만포인트 지급
    };

    userinfo.push(newUser); // 가짜 데이터베이스에 추가 (실제로는 데이터베이스 연결 필요)

    res.status(201).json({
      status:201,
      message: '회원가입이 완료되었습니다.',
      user: newUser,
    });
  } catch (error: any) { // 여기서 any를 사용해도 돼요
    console.error('회원가입 에러:', error.message); // 여기서는 타입스크립트가 오류를 발생하지 않습니다.
    res.status(500).json({status:500, message: '서버 에러입니다. 잠시 후 다시 시도해주세요.' });
  }
});



//비번 해시 처리 하기


//로그인 API
authRouter.post('/sign-in',(req:Request, res:Response, next:NextFunction)=>{

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
  const user = userinfo.find(user => user.email === email)
  if(!user){
    return res.status(401).json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
  }

 // 비밀번호 일치 여부 확인 (실제로는 해싱된 비밀번호와 비교해야 함)
 if (user.password !== password) {
  return res.status(401).json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
}

// 로그인 성공
res.status(200).json({ status: 200, message: '로그인 성공', user });

})

//로그인시 accesstoken 인증 필요


export default authRouter;