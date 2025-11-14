import express from 'express';
import contactRoutes from './routes/contactRoutes';

const app = express();
app.use(express.json());

app.use('/', contactRoutes);

export default app;
