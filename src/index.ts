import express from "express";
import bodyParser from "body-parser";
import identifyRoutes from "./routes/identifyroutes";
import pool from "./db";

const app = express();
app.use(bodyParser.json());

app.use("/identify", identifyRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`identify-service listening on port ${PORT}`);
});
