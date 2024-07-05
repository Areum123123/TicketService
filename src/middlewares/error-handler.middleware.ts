// error-handler.ts

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  // // Joi에서 발생한 에러 처리
  // if (err.name === 'ValidationError') {
  //   return res.status(400).json({
  //     status: 400,
  //     message: err.message,
  //   });
  // }

  // 다른 예상치 못한 에러 처리
  return res.status(500).json({
    status: 500,
    message: '예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요.',
  });
};


//js일 경우 이렇게 .
// export const errorHandler = (err, req, res, next) => {
//     console.error(err);
  
//     // joi에서 발생한 에러 처리
//     // if (err.name === 'ValidationError') {
//     //   return res.status(400).json({
//     //     status: 400,
//     //     message: err.message,
//     //   });
//     // }
  
//     // 그 밖의 예상치 못한 에러 처리
//     return res.status(500).json({
//       status: 500,
//       message: '예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요.',
//     });
//   };