import { Router } from 'express';
import { runDaily } from '../controllers/jobsController.js';

const router = Router();
router.post('/diario', runDaily);
export default router;
