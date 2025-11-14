import app from './app';
import { pool } from './config/db';

const PORT = process.env.PORT || 3000;

pool.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ DB connection failed:', err.message));
