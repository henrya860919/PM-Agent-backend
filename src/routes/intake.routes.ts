// src/routes/intake.routes.ts
// Intake API 路由（規格 3. Intake & Analysis）

import { requireAuthenticated } from '@/middleware/auth';
import { intakeController } from '@/modules/intake/controller';
import { Router } from 'express';

const router = Router();

router.use(requireAuthenticated);

router.get('/', intakeController.getIntakes);
router.get('/:intakeId', intakeController.getIntakeById);

export default router;
