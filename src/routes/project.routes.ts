// src/routes/project.routes.ts
import { projectController } from '@/modules/project/controller';
import { Router } from 'express';

const router = Router();

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectCode', projectController.getProjectByCode);
router.put('/:projectCode', projectController.updateProject);
router.delete('/:projectCode', projectController.deleteProject);

export default router;
