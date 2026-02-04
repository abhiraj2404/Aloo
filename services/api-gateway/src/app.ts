import express from "express"
import routes from "./routes/index.route.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import type { Request,Response } from "express";

export const app: express.Express = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: () => void) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});
app.use("/api/v1", routes);
app.use(errorHandler);

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


