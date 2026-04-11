import express from "express"
import type { Request,Response } from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/index.route.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import cors from "cors";

export const app: express.Express = express();

app.use(cors( {origin:true,credentials:true} ));
app.use(cookieParser()); // makes cookies accessible as a Js object in the form of req.cookies

app.use(express.json()); // 1. runs when header is content-type: application/json
                         // 2. make json data sent in body available as a Js object in form of req.body 

app.use(express.urlencoded({ extended: true })); // 1. runs when header is content-type: application/x-www-form-urlencoded
                                                 // 2. used bcz in olden days data was directly sent from an HTML form to backend. Data was added to the request body using URL-encoding 
                                                 // 3. called url-encoded bcz form data is encoded using the url-encoding format

// Multer - 1. runs when header is Content-type: multipart/form-data  
//          2. used when we have to send image/file/video data from fontend to backend

//logger
app.use((req: Request, res: Response, next: () => void) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

app.use("/api/v1", routes);

app.get("/", (req: Request, res: Response) => {
  res.send("hello world")
})

app.get("/health", (req: Request, res: Response) => {  
  res.json({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);


