import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function cleanAssistantText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    if (stripped.startsWith('{') && stripped.endsWith('}')) {
      text = stripped;
    }
  }

  // Detect and unwrap JSON object
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        if (typeof parsed.response === 'string') return parsed.response;
        if (typeof parsed.message === 'string') return parsed.message;
        if (typeof parsed.text === 'string') return parsed.text;
        if (typeof parsed.answer === 'string') return parsed.answer;
        if (typeof parsed.reply === 'string') return parsed.reply;
        if (typeof parsed.hint === 'string') return parsed.hint;
        const firstStringVal = Object.values(parsed).find((v) => typeof v === 'string');
        if (firstStringVal) return firstStringVal as string;
      }
    } catch {
      const match = text.match(/"(?:response|message|text|answer|reply|hint)"\s*:\s*"([\s\S]*?)"\s*}/);
      if (match && match[1]) {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {
          return match[1];
        }
      }
    }
  }

  return text;
}

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code';
  content: string;
}

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', content: raw.slice(1, -1) });
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', content: raw.slice(2, -2) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', content: raw.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return tokens;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const tokens = parseInlineTokens(text);
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    if (token.type === 'bold') {
      return (
        <strong key={key} className="font-bold text-stone-950">
          {token.content}
        </strong>
      );
    }
    if (token.type === 'italic') {
      return (
        <em key={key} className="italic text-stone-800">
          {token.content}
        </em>
      );
    }
    if (token.type === 'code') {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-100/80 border border-amber-300/80 text-amber-950 font-mono text-[11px] font-semibold"
        >
          {token.content}
        </code>
      );
    }
    return <span key={key}>{token.content}</span>;
  });
}

interface BlockCodeProps {
  code: string;
  lang?: string;
}

function BlockCode({ code, lang }: BlockCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl border border-stone-800 bg-stone-950 overflow-hidden text-xs shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border-b border-stone-800 text-[10px] text-stone-400 font-mono">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-stone-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-stone-100 leading-relaxed text-[11px]">
        {code}
      </pre>
    </div>
  );
}

interface RichMarkdownProps {
  content: string;
  className?: string;
}

export function RichMarkdown({ content, className = '' }: RichMarkdownProps) {
  const cleaned = cleanAssistantText(content);
  if (!cleaned) return null;

  // Split into lines and parse markdown blocks
  const lines = cleaned.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code blocks (```lang ... ```)
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <BlockCode key={`block-${blockKey++}`} code={codeLines.join('\n')} lang={lang} />
      );
      continue;
    }

    // 2. Headings (###, ##, #)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1 || level === 2) {
        elements.push(
          <h4
            key={`block-${blockKey++}`}
            className="text-xs sm:text-sm font-bold text-stone-950 mt-2 mb-1 pb-0.5 border-b border-amber-200/60"
          >
            {renderInline(text, `h-${blockKey}`)}
          </h4>
        );
      } else {
        elements.push(
          <h5
            key={`block-${blockKey++}`}
            className="text-xs font-bold text-amber-950 mt-1.5 mb-0.5"
          >
            {renderInline(text, `h-${blockKey}`)}
          </h5>
        );
      }
      i++;
      continue;
    }

    // 3. Blockquotes (> text)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <div
          key={`block-${blockKey++}`}
          className="my-1.5 pl-3 py-1 border-l-2 border-amber-500 bg-amber-50/50 rounded-r-lg text-stone-800 italic text-[11px]"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{renderInline(ql, `q-${blockKey}-${idx}`)}</p>
          ))}
        </div>
      );
      continue;
    }

    // 4. Bullet lists (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`block-${blockKey++}`} className="my-1.5 space-y-1 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-stone-900 leading-relaxed text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
              <div className="flex-1">{renderInline(item, `b-${blockKey}-${idx}`)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Numbered lists (1. , 2. )
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`block-${blockKey++}`} className="my-1.5 space-y-1 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-stone-900 leading-relaxed text-xs">
              <span className="font-mono text-amber-700 font-bold shrink-0 text-[11px]">
                {idx + 1}.
              </span>
              <div className="flex-1">{renderInline(item, `n-${blockKey}-${idx}`)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 7. Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^#{1,4}\s+/) &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={`block-${blockKey++}`} className="my-1 leading-relaxed text-stone-900 text-xs">
        {renderInline(paraLines.join(' '), `p-${blockKey}`)}
      </p>
    );
  }

  return <div className={`space-y-1.5 text-xs text-stone-900 ${className}`}>{elements}</div>;
}
