import { parse as parseYaml } from 'yaml';

type FrontmatterResult = {
  data: Record<string, any>;
  content: string;
};

export default function parseFrontmatter(source: string): FrontmatterResult {
  const normalized = source.replace(/^\uFEFF/, '');
  const lines = normalized.split(/\r?\n/);

  if (lines[0]?.trim() !== '---') {
    return { data: {}, content: normalized };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closingIndex === -1) {
    return { data: {}, content: normalized };
  }

  const rawData = lines.slice(1, closingIndex).join('\n');
  const parsed = parseYaml(rawData);

  return {
    data: parsed && typeof parsed === 'object' ? parsed as Record<string, any> : {},
    content: lines.slice(closingIndex + 1).join('\n'),
  };
}
