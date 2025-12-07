import { Router } from 'express';
import { getVoices } from '../controllers/elevenLabsController';

const router = Router();

router.get('/voices', getVoices);

export default router;
