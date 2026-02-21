/**
 * 開發用：執行時開關「模擬音檔處理」。
 * 僅在 NODE_ENV=development 時由 API 切換；.env 的 MOCK_AUDIO_PROCESSING 仍可強制開啟。
 */
let mockAudioEnabled = false;

export function getMockAudioEnabled(): boolean {
  return mockAudioEnabled;
}

export function setMockAudioEnabled(enabled: boolean): void {
  mockAudioEnabled = Boolean(enabled);
}
