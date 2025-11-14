import express from 'express';
import { identifyContact } from '../controllers/contactController';

const router = express.Router();

router.post('/identify', identifyContact);

export default router;
