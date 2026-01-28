import express from "express"
import userRoutes from './routes/user.route.js';
import shopRoutes from './routes/shop.route.js';
import categoryRoutes from './routes/category.route.js';
import itemRoutes from './routes/item.route.js';
import tableRoutes from './routes/table.route.js';
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


app.get("/", (req: express.Request, res: express.Response) => {
    res.send("hello world")
})

// Health check
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString()
  });
});


app.use('/user',userRoutes);
app.use('/shop',shopRoutes);
app.use('/category',categoryRoutes);
app.use('/item',itemRoutes);
app.use('/table',tableRoutes);




app.use(errorHandler);