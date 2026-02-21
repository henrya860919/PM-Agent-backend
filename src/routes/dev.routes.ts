/**
 * 僅在 NODE_ENV=development 時註冊的開發用 API（例如模擬音檔開關）。
 */
import { Router, Request, Response } from 'express';
import { getMockAudioEnabled, setMockAudioEnabled } from '@/lib/dev-mock-audio';

const router = Router();

router.get('/mock-audio', (req: Request, res: Response) => {
  res.json({ enabled: getMockAudioEnabled() });
});

router.put('/mock-audio', (req: Request, res: Response) => {
  const enabled = req.body?.enabled === true;
  setMockAudioEnabled(enabled);
  res.json({ enabled: getMockAudioEnabled() });
});

export default router;
