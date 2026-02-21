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

export type WhisperResult = {
  text: string;
  language?: string;
  duration?: number;
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

  const verbose = response as { text: string; language?: string; duration?: number };
  return {
    text: verbose.text ?? (typeof response === 'string' ? response : ''),
    language: verbose.language,
    duration: verbose.duration,
  };
}
