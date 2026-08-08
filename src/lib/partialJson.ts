/**
 * Parse a JSON object that is still being streamed.
 *
 * The model writes its answer left to right, so at any moment the text is a
 * valid JSON prefix rather than valid JSON. This closes whatever is still open
 * — an unterminated string, a dangling key, the enclosing braces — and returns
 * the part that is complete, so the page can show lessons as they arrive
 * instead of nothing until the last character.
 *
 * Returns null while there is not yet enough to parse. Given the finished text
 * it returns exactly what JSON.parse would.
 */
export function parsePartialJson<T = unknown>(raw: string): T | null {
  const start = raw.indexOf('{');
  if (start === -1) return null;
  const text = raw.slice(start);

  const closersFor = (s: string): { closers: string[]; inString: boolean } => {
    const closers: string[] = [];
    let inString = false, escaped = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { if (inString) escaped = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{') closers.push('}');
      else if (c === '[') closers.push(']');
      else if (c === '}' || c === ']') closers.pop();
    }
    return { closers, inString };
  };

  let { closers, inString } = closersFor(text);
  let body = inString ? text + '"' : text;

  // Trim whatever was half-written when the chunk ended: a trailing comma, a
  // key with no value yet, or the start of a literal like `tru`.
  for (;;) {
    const before = body;
    body = body
      .replace(/\s+$/, '')
      .replace(/,$/, '')
      .replace(/"(?:[^"\\]|\\.)*"\s*:$/, '')
      .replace(/:\s*(?:t|tr|tru|f|fa|fal|fals|n|nu|nul|-)$/, ': null')
      .replace(/,$/, '');
    if (body === before) break;
  }

  const attempt = (s: string): T | undefined => {
    try { return JSON.parse(s) as T; } catch { return undefined; }
  };

  for (let tries = 0; tries < 40; tries++) {
    const parsed = attempt(body + closers.join(''));
    if (parsed !== undefined) return parsed;
    // Still broken — drop the trailing partial value and try the shorter text.
    const cut = Math.max(body.lastIndexOf(','), body.lastIndexOf('{'), body.lastIndexOf('['));
    if (cut <= 0) return null;
    body = body.slice(0, body[cut] === ',' ? cut : cut + 1);
    ({ closers, inString } = closersFor(body));
    if (inString) body += '"';
  }
  return null;
}
