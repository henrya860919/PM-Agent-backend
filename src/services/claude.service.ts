// src/services/claude.service.ts
import { env } from '@/_env';
import type { LogicFlagDto } from '@/modules/file/type';
import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Set it in .env to use Claude analysis.',
    );
  }
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

export type ClaudeAnalysisResult = {
  summary: string;
  keyDecisions: Array<{ title: string; description?: string }>;
  risks: Array<{ title: string; severity?: string; description?: string }>;
  dependencies: Array<{ name: string; description?: string }>;
  logicFlags: LogicFlagDto[];
};

const LOGIC_FLAG_CATEGORIES: LogicFlagDto['category'][] = [
  'permissions',
  'import-export',
  'hierarchy',
  'data-flow',
];
const LOGIC_FLAG_SEVERITIES: LogicFlagDto['severity'][] = [
  'critical',
  'warning',
  'info',
];

function normalizeLogicFlags(
  raw: Array<{
    id?: string;
    category?: string;
    severity?: string;
    message?: string;
    source?: string;
  }>,
  source: string,
): LogicFlagDto[] {
  return (raw || []).map((f, i) => ({
    id: f.id ?? `lf-${i + 1}`,
    category: LOGIC_FLAG_CATEGORIES.includes(f.category as any)
      ? (f.category as LogicFlagDto['category'])
      : 'data-flow',
    severity: LOGIC_FLAG_SEVERITIES.includes(f.severity as any)
      ? (f.severity as LogicFlagDto['severity'])
      : 'info',
    message: typeof f.message === 'string' ? f.message : 'Flag',
    source: typeof f.source === 'string' ? f.source : source,
  }));
}

/**
 * Analyze transcript and return structured summary + logic flags.
 */
export async function analyzeTranscriptWithClaude(
  transcript: string,
  sourceLabel?: string,
): Promise<ClaudeAnalysisResult> {
  const client = getClient();
  const model = env.CLAUDE_MODEL;
  const source = sourceLabel ?? 'Transcript analysis';

  const systemPrompt = `You are a PM assistant. Analyze the meeting/audio transcript and output valid JSON only (no markdown).
Use this exact structure:
{
  "summary": "2-4 sentence summary",
  "keyDecisions": [{"title": "...", "description": "..."}],
  "risks": [{"title": "...", "severity": "critical|warning|info", "description": "..."}],
  "dependencies": [{"name": "...", "description": "..."}],
  "logicFlags": [
    {"id": "lf-1", "category": "permissions|import-export|hierarchy|data-flow", "severity": "critical|warning|info", "message": "issue description", "source": "Transcript analysis"}
  ]
}
Logic flags: issues the PM should track (RBAC, export format, nested teams, data sync, etc.). Use category and severity exactly as in the schema.`;

  const userPrompt = `Analyze this transcript${sourceLabel ? ` (${sourceLabel})` : ''}:\n\n${transcript.slice(0, 150000)}`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === 'text');
  const text = block?.type === 'text' ? block.text : '';
  let parsed: {
    summary?: string;
    keyDecisions?: Array<{ title: string; description?: string }>;
    risks?: Array<{ title: string; severity?: string; description?: string }>;
    dependencies?: Array<{ name: string; description?: string }>;
    logicFlags?: Array<{
      id?: string;
      category?: string;
      severity?: string;
      message?: string;
      source?: string;
    }>;
  };
  try {
    const cleaned = text.replace(/^```\w*\n?|\n?```$/g, '').trim();
    parsed = JSON.parse(cleaned) as typeof parsed;
  } catch {
    parsed = {
      summary: text.slice(0, 500),
      keyDecisions: [],
      risks: [],
      dependencies: [],
      logicFlags: [],
    };
  }

  const logicFlags = normalizeLogicFlags(
    Array.isArray(parsed.logicFlags) ? parsed.logicFlags : [],
    source,
  );

  return {
    summary: parsed.summary ?? '',
    keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
    logicFlags,
  };
}
