import express from 'express';

const app = express();
const port = 3020;

app.get('/', (req, res) => {
    res.send('Hello World! hahaha');
});

app.listen(port, () => {
    console.log(`${port}번 포트로 서버가 열렸습니다.`);
});
