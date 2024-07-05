import express from "express";
import authRouter  from "./auth.router";



const apiRouter = express.Router();


apiRouter.use('/auth',authRouter )



export default apiRouter;