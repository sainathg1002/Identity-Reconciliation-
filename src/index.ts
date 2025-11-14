import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import identifyRoutes from "./routes/identifyroutes";
import logger from "./utils/logger";
import pool from "./db";

const app = express();
app.use(bodyParser.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  logger.debug("Health check request");
  res.status(200).json({ status: "ok", service: "identify-service" });
});

// Routes
app.use("/identify", identifyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn("Not found", { path: req.path, method: req.method });
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error", { message: err.message, status: err.status });
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`identify-service listening on port ${PORT}`);
});
