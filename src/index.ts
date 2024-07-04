import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error-handler.middleware';
import authRouter from './routers/auth.router'

dotenv.config();


const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/auth', authRouter);

app.get('/', (req, res) => {
    res.send('Hello World! hahaha');
});


app.use(errorHandler); //error미들웨어

app.listen(port, () => {
    console.log(`${port}번 포트로 서버가 열렸습니다.`);
});
