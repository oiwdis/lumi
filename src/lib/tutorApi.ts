import type { CourseId } from '../types';

const LANG_NAMES: Record<CourseId, string> = {
  'en-es': 'Spanish',
  'en-zh': 'Mandarin Chinese',
  'en-fr': 'French',
  'en-ja': 'Japanese',
  'en-ko': 'Korean',
  'en-de': 'German',
};

export interface TutorContext {
  courseId: CourseId;
  lessonIndex: number;
  activityType: string;
  currentWord?: { word: string; translation: string; example: string };
  storyTitle?: string;
  storyText?: string;
}

function buildSystemPrompt(ctx: TutorContext): string {
  const lang = LANG_NAMES[ctx.courseId];
  const lessonNum = ctx.lessonIndex + 1;

  let contextBlock = '';
  if (ctx.currentWord) {
    contextBlock = `
Current vocabulary word:
- Target: "${ctx.currentWord.word}"
- Meaning: "${ctx.currentWord.translation}"
- Example: "${ctx.currentWord.example}"
`;
  } else if (ctx.storyTitle) {
    contextBlock = `
Current activity: reading the story "${ctx.storyTitle}"
${ctx.storyText ? `Story excerpt: ${ctx.storyText.slice(0, 400)}...` : ''}
`;
  }

  return `You are Lumi, a warm, encouraging language tutor helping a student learn ${lang}. They are on Lesson ${lessonNum}, doing a "${ctx.activityType}" activity.
${contextBlock}
Your teaching style:
- Keep responses SHORT (2–4 sentences max) unless the student asks for more depth.
- Use the comprehensible input / i+1 method: teach slightly above the student's current level.
- Give hints rather than direct answers when the student is struggling.
- Use English explanations but naturally weave in ${lang} words with translations in parentheses.
- Be warm, patient, and celebrate small wins.
- If the student asks how to say something, show the ${lang} word and a quick mnemonic if helpful.
- Never be condescending. Treat the student as an intelligent adult.

Respond only with your teaching message — no preamble or meta-commentary.`;
}

export async function streamTutorMessage(
  ctx: TutorContext,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  try {
    const resp = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt: buildSystemPrompt(ctx) }),
    });

    if (!resp.ok || !resp.body) {
      const data = await resp.json().catch(() => ({}));
      onError((data as { error?: string }).error ?? 'Server error');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6);
        if (raw === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(raw) as { text?: string; error?: string };
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.text) onChunk(parsed.text);
        } catch { /* skip malformed */ }
      }
    }
    onDone();
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : String(err));
  }
}
