import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import identifyRoutes from "./routes/identifyroutes";
import pool from "./db";

const app = express();
app.use(bodyParser.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "identify-service" });
});

// Routes
app.use("/identify", identifyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`identify-service listening on port ${PORT}`);
});
