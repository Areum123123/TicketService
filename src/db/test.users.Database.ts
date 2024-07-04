// src/db/fakeDatabase.ts

import { User } from '../models/Users';

export const userinfo: User[] = [
  {
    userId: 1,
    email: 'cup123@naver.com',
    password: 'aaa54321', // 실제로는 해싱 처리가 필요
    name: 'watercup',
    address: '123 Main St',
    point: 1000000,
  },
  {
    userId: 2,
    email: 'haha1234@naver.com',
    password: 'aaa54321', // 실제로는 해싱 처리가 필요
    name: 'hahaman',
    address: '456 Maple Ave',
    point: 1000000,
  },
  {
    userId: 3,
    email: "areum123@gmail.com",
    password: "aaa54321",
    name: "강냉이",
    address: "서울시 서초구 0000000",
    point: 1000000,
}

];
