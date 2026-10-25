export type TeacherBlock = { kind: 'text' | 'code' | 'math'; text: string; language?: string };
// Render text, never HTML. Preserve fenced code exactly, including incomplete fences.
export function teacherBlocks(content: string): TeacherBlock[] {
  const blocks: TeacherBlock[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let code = false, language = '', buffer: string[] = [];
  const flush = () => {
    const text = buffer.join('\n');
    if (buffer.length && code) blocks.push({ kind: 'code', text, language });
    else if (buffer.length) {
      const expression = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
      let end = 0;
      for (const match of text.matchAll(expression)) {
        if (match.index > end) blocks.push({ kind: 'text', text: text.slice(end, match.index) });
        blocks.push({ kind: 'math', text: match[1] || match[2] || match[3] || '' });
        end = match.index + match[0].length;
      }
      if (end < text.length) blocks.push({ kind: 'text', text: text.slice(end) });
    }
    buffer = [];
  };
  for (const line of lines) {
    const fence = line.match(/^\s*```([^`]*)$/);
    if (fence && (!code || !fence[1]?.trim())) {
      flush(); code = !code; language = code ? fence[1]?.trim() || 'code' : '';
    } else buffer.push(line);
  }
  flush();
  return blocks;
}
