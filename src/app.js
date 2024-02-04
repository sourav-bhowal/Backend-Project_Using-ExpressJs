import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true
}));

app.use(express.json({limit: "16kb"}));

app.use(express.urlencoded({
    extended: true, 
    limit: "16kb"
}));

app.use(express.static("public"));  // "static" is used as cache memory to store data on our server such as img or icons.

app.use(cookieParser());


// Routes import
import userRouter from "./routes/user.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter);


export default app;