import express from "express"

const app = express();

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

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})