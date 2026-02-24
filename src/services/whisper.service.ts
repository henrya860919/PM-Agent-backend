// src/services/whisper.service.ts
import { env } from '@/_env';
import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Set it in .env to use Whisper transcription.');
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

/** 單一時間區間與對應文字（Whisper verbose_json segments） */
export type WhisperSegment = {
  start: number;
  end: number;
  text: string;
};

export type WhisperResult = {
  text: string;
  language?: string;
  duration?: number;
  /** 時間軸：每段的開始/結束秒數與文字，供前端列表與跳轉使用 */
  segments: WhisperSegment[];
};

/**
 * Transcribe audio buffer using OpenAI Whisper.
 * @param buffer - Audio file buffer (e.g. from storage)
 * @param mimeType - Optional MIME type for filename hint (e.g. audio/mpeg -> .mp3)
 */
export async function transcribeWithWhisper(
  buffer: Buffer,
  mimeType?: string,
): Promise<WhisperResult> {
  const client = getClient();
  const ext = mimeType?.startsWith('audio/')
    ? mimeType === 'audio/mpeg' || mimeType === 'audio/mp3'
      ? 'mp3'
      : mimeType === 'audio/wav'
        ? 'wav'
        : mimeType === 'audio/webm'
          ? 'webm'
          : mimeType === 'audio/mp4' || mimeType === 'audio/x-m4a'
            ? 'm4a'
            : mimeType === 'audio/ogg'
              ? 'ogg'
              : mimeType === 'audio/flac'
                ? 'flac'
                : 'mp3'
    : 'mp3';
  const file = new File([new Uint8Array(buffer)], `audio.${ext}`, {
    type: mimeType === 'audio/x-m4a' ? 'audio/mp4' : mimeType || 'audio/mpeg',
  });

  const response = await client.audio.transcriptions.create({
    file,
    model: env.WHISPER_MODEL,
    response_format: 'verbose_json',
  });

  type VerboseResponse = {
    text?: string;
    language?: string;
    duration?: number;
    segments?: Array<{ start: number; end: number; text: string }>;
  };
  const verbose = response as VerboseResponse;
  const rawSegments = verbose.segments ?? [];
  const segments: WhisperSegment[] = rawSegments.map((s) => ({
    start: Number(s.start),
    end: Number(s.end),
    text: String(s.text ?? '').trim(),
  })).filter((s) => s.text.length > 0);

  return {
    text: verbose.text ?? (typeof response === 'string' ? response : ''),
    language: verbose.language,
    duration: verbose.duration,
    segments,
  };
}
