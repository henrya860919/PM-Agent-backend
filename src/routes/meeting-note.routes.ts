import { requireAuthenticated } from '@/middleware/auth';
import { meetingNoteController } from '@/modules/meeting-note/controller';
import { Router } from 'express';

const router = Router();

router.use(requireAuthenticated);

router.post('/from-intake', meetingNoteController.createFromIntake);
router.post('/', meetingNoteController.create);
router.get('/', meetingNoteController.list);
router.get('/:meetingNoteId', meetingNoteController.getById);
router.patch('/:meetingNoteId', meetingNoteController.update);
router.delete('/:meetingNoteId', meetingNoteController.delete);

export default router;
