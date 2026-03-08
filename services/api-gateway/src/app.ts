import express from "express"
import type { Request,Response } from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/index.route.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import cors from "cors";

export const app: express.Express = express();

app.use(cors( {origin:true,credentials:true} ));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//logger
app.use((req: Request, res: Response, next: () => void) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

//api
app.use("/api/v1", routes);

//home
app.get("/", (req: Request, res: Response) => {
  res.send("hello world")
})

//health-check
app.get("/health", (req: Request, res: Response) => {  
  res.json({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString()
  });
});

//error-handler
app.use(errorHandler);


