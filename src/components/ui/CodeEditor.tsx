import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Code2,
  FileCode,
  Maximize2,
  Minimize2,
  WrapText,
  Edit3,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Button } from './Button';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  fileName?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  showLineNumbers?: boolean;
  allowEditToggle?: boolean;
}

interface Token {
  type:
    | 'keyword'
    | 'type'
    | 'function'
    | 'string'
    | 'number'
    | 'boolean'
    | 'comment'
    | 'annotation'
    | 'operator'
    | 'punctuation'
    | 'variable'
    | 'constant'
    | 'plain';
  text: string;
}

function tokenizeCode(code: string, language: string = 'java'): Token[][] {
  const lang = (language || 'java').toLowerCase();
  const isPython = lang === 'python' || lang === 'py';
  const isCpp = lang === 'cpp' || lang === 'c++';
  const isJs = lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts';

  const javaKeywords =
    'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|var|record|yield|sealed|permits';
  const pythonKeywords =
    'def|class|import|from|return|if|elif|else|for|while|in|is|not|and|or|try|except|finally|raise|with|as|lambda|pass|yield|async|await|self|nonlocal|global|del|assert';
  const cppKeywords =
    'include|using|namespace|std|vector|string|cout|cin|endl|auto|nullptr|template|typename|struct|const|int|void|return|if|else|for|while|class|public|private|protected|virtual|override|new|delete|sizeof|typedef|static_cast|dynamic_cast|reinterpret_cast';
  const jsKeywords =
    'function|const|let|var|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|this|import|export|default|from|as|async|await|typeof|instanceof|in|of|yield|void|delete';

  let activeKeywords = javaKeywords;
  if (isPython) activeKeywords = pythonKeywords;
  else if (isCpp) activeKeywords = cppKeywords;
  else if (isJs) activeKeywords = jsKeywords;

  const builtInTypes =
    'String|Integer|Boolean|Double|Character|Long|Short|Byte|Float|Object|Class|Math|System|List|ArrayList|LinkedList|Map|HashMap|TreeMap|LinkedHashMap|Set|HashSet|TreeSet|Queue|Deque|ArrayDeque|PriorityQueue|Stack|Vector|Arrays|Collections|Objects|Optional|Stream|Collectors|TreeNode|ListNode|Node|Graph|Trie|Pair|Solution|Comparable|Comparator|Iterable|Iterator|Exception|RuntimeException|IllegalArgumentException|StringBuilder|StringBuffer|int|void|boolean|char|double|float|long|short|byte|auto|size_t|uint32_t|int64_t|dict|list|set|tuple|str|bool';

  const lines = (code || '').split('\n');
  const tokenizedLines: Token[][] = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tokens: Token[] = [];
    let idx = 0;

    while (idx < line.length) {
      if (inBlockComment) {
        const endComment = line.indexOf('*/', idx);
        if (endComment !== -1) {
          tokens.push({ type: 'comment', text: line.substring(idx, endComment + 2) });
          idx = endComment + 2;
          inBlockComment = false;
        } else {
          tokens.push({ type: 'comment', text: line.substring(idx) });
          idx = line.length;
        }
        continue;
      }

      // Check block comment start (/* ... */)
      if (line.substr(idx, 2) === '/*') {
        const endComment = line.indexOf('*/', idx + 2);
        if (endComment !== -1) {
          tokens.push({ type: 'comment', text: line.substring(idx, endComment + 2) });
          idx = endComment + 2;
        } else {
          tokens.push({ type: 'comment', text: line.substring(idx) });
          idx = line.length;
          inBlockComment = true;
        }
        continue;
      }

      // Check single line comment (// ... or # ...)
      if (line.substr(idx, 2) === '//' || (isPython && line[idx] === '#')) {
        tokens.push({ type: 'comment', text: line.substring(idx) });
        idx = line.length;
        continue;
      }

      // Check string literal ("..." or '...' or `...`)
      if (line[idx] === '"' || line[idx] === "'" || (isJs && line[idx] === '`')) {
        const quote = line[idx];
        let end = idx + 1;
        while (end < line.length) {
          if (line[end] === '\\') {
            end += 2;
            continue;
          }
          if (line[end] === quote) {
            end++;
            break;
          }
          end++;
        }
        tokens.push({ type: 'string', text: line.substring(idx, end) });
        idx = end;
        continue;
      }

      // Check annotation (@Override) or C++ preprocessor (#include)
      if ((line[idx] === '@' || (isCpp && line[idx] === '#')) && /[a-zA-Z]/.test(line[idx + 1] || '')) {
        const match = line.substring(idx).match(/^([@#][a-zA-Z_]\w*)/);
        if (match) {
          tokens.push({ type: 'annotation', text: match[1] });
          idx += match[1].length;
          continue;
        }
      }

      // Check word token (keyword, type, function, constant, identifier)
      if (/[a-zA-Z_$]/.test(line[idx])) {
        const match = line.substring(idx).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
        if (match) {
          const word = match[0];
          const afterWord = line.substring(idx + word.length);
          const isFunc = /^\s*\(/.test(afterWord);

          const isKw = new RegExp(`^(?:${activeKeywords})$`).test(word);
          const isType =
            new RegExp(`^(?:${builtInTypes})$`).test(word) ||
            /^[A-Z][a-zA-Z0-9]*$/.test(word);
          const isConst = /^[A-Z][A-Z0-9_]{2,}$/.test(word);
          const isBool = /^(?:true|false|null|None|True|False|nullptr)$/.test(word);

          if (isBool) {
            tokens.push({ type: 'boolean', text: word });
          } else if (isKw) {
            tokens.push({ type: 'keyword', text: word });
          } else if (isType && !isFunc) {
            tokens.push({ type: 'type', text: word });
          } else if (isFunc) {
            tokens.push({ type: 'function', text: word });
          } else if (isConst) {
            tokens.push({ type: 'constant', text: word });
          } else {
            tokens.push({ type: 'variable', text: word });
          }

          idx += word.length;
          continue;
        }
      }

      // Check number literal (integer, float, hex)
      if (/\d/.test(line[idx]) || (line[idx] === '.' && /\d/.test(line[idx + 1] || ''))) {
        const match = line
          .substring(idx)
          .match(/^(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?)/);
        if (match) {
          tokens.push({ type: 'number', text: match[0] });
          idx += match[0].length;
          continue;
        }
      }

      // Check operator
      const opMatch = line.substring(idx).match(/^(?:[+\-*/%=!&|^~<>?:.]+|->|::)/);
      if (opMatch) {
        tokens.push({ type: 'operator', text: opMatch[0] });
        idx += opMatch[0].length;
        continue;
      }

      // Check punctuation
      if (/[{}()\[\];,]/.test(line[idx])) {
        tokens.push({ type: 'punctuation', text: line[idx] });
        idx++;
        continue;
      }

      // Plain whitespace or unknown
      tokens.push({ type: 'plain', text: line[idx] });
      idx++;
    }

    tokenizedLines.push(tokens);
  }

  return tokenizedLines;
}

export function CodeEditor({
  value,
  onChange,
  language = 'java',
  readOnly = false,
  fileName,
  minHeight = '280px',
  maxHeight = '520px',
  className = '',
  showLineNumbers = true,
  allowEditToggle = true,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [initialValue] = useState(value);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultFileName = useMemo(() => {
    if (fileName) return fileName;
    const l = language.toLowerCase();
    if (l === 'python' || l === 'py') return 'Solution.py';
    if (l === 'cpp' || l === 'c++') return 'Solution.cpp';
    if (l === 'javascript' || l === 'js') return 'Solution.js';
    return 'Solution.java';
  }, [fileName, language]);

  // Sync state if readOnly prop changes
  useEffect(() => {
    setIsEditing(!readOnly);
  }, [readOnly]);

  // Copy code to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset to original
  const handleReset = () => {
    if (onChange) {
      onChange(initialValue);
    }
  };

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    '; // 4 spaces

      const newValue = value.substring(0, start) + spaces + value.substring(end);
      if (onChange) {
        onChange(newValue);
      }

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      });
    }
  };

  const tokenizedLines = useMemo(() => tokenizeCode(value, language), [value, language]);
  const lineCount = tokenizedLines.length || 1;

  return (
    <div
      ref={containerRef}
      className={`rounded-lg border border-border bg-[#0D1117] text-[#c9d1d9] font-mono text-xs overflow-hidden shadow-xs flex flex-col ${className}`}
    >
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#21262d] bg-[#161B22] shrink-0 select-none">
        {/* Left: Window dots + File Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/90 border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/90 border border-[#dea123]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/90 border border-[#1aab29]" />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0D1117] border border-[#30363d] text-caption text-[#e6edf3] font-medium">
            <FileCode className="h-3.5 w-3.5 text-primary" />
            <span>{defaultFileName}</span>
          </div>

          <span className="text-caption font-mono text-[#8b949e] uppercase px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d]">
            {language.toUpperCase()}
          </span>
        </div>

        {/* Right: Stats & Actions */}
        <div className="flex items-center gap-1.5">
          <span className="text-caption font-mono text-[#8b949e] mr-2 hidden sm:inline tabular-nums">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWrapLines(!wrapLines)}
            className={`h-7 px-2 text-caption ${
              wrapLines ? 'text-primary bg-[#21262d]' : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
            title={wrapLines ? 'Disable line wrapping' : 'Enable line wrapping'}
          >
            <WrapText className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Wrap</span>
          </Button>

          {allowEditToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className={`h-7 px-2 text-caption ${
                isEditing ? 'text-primary bg-[#21262d]' : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title={isEditing ? 'Switch to code view' : 'Switch to editable code editor'}
            >
              {isEditing ? (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
                  <span className="hidden sm:inline">View</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              )}
            </Button>
          )}

          {isEditing && value !== initialValue && onChange && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-caption text-[#8b949e] hover:text-[#e6edf3]"
              title="Reset code to original"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-caption text-[#8b949e] hover:text-[#e6edf3]"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success mr-1" />
                <span className="text-success font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Body: Single unified scroll container */}
      <div
        className="relative flex overflow-auto"
        style={{ minHeight, maxHeight }}
      >
        {/* Line Numbers Gutter: Sticky to the left */}
        {showLineNumbers && (
          <div
            className="sticky left-0 z-10 w-12 shrink-0 py-3 pl-2 pr-3 select-none text-right font-mono text-caption text-[#484f58] bg-[#090D12] border-r border-[#21262d] leading-relaxed"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Code Content Area: Strictly no nested scrollbars */}
        <div className="relative flex-1 min-w-0">
          {/* Syntax-Highlighted View */}
          <pre
            className={`p-3 m-0 font-mono text-xs leading-relaxed text-[#c9d1d9] ${
              wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
            } ${isEditing ? 'pointer-events-none select-none' : 'select-text'}`}
          >
            <code>
              {tokenizedLines.map((tokens, lineIdx) => (
                <div key={lineIdx} className="leading-relaxed hover:bg-[#161B22]/50">
                  {tokens.length === 0 ? (
                    '\n'
                  ) : (
                    tokens.map((token, tokenIdx) => {
                      let colorClass = 'text-[#c9d1d9]'; // default plain

                      switch (token.type) {
                        case 'keyword':
                          colorClass = 'text-[#d2a8ff] font-semibold'; // violet / purple
                          break;
                        case 'type':
                          colorClass = 'text-[#ffa657] font-semibold'; // warm amber / gold
                          break;
                        case 'function':
                          colorClass = 'text-[#79c0ff]'; // sky blue
                          break;
                        case 'string':
                          colorClass = 'text-[#7ee787]'; // emerald green
                          break;
                        case 'number':
                        case 'boolean':
                          colorClass = 'text-[#ff7b72]'; // coral / orange
                          break;
                        case 'comment':
                          colorClass = 'text-[#8b949e] italic'; // muted slate
                          break;
                        case 'annotation':
                          colorClass = 'text-[#d2a8ff] font-semibold'; // purple annotation
                          break;
                        case 'operator':
                          colorClass = 'text-[#79c0ff]'; // cyan operator
                          break;
                        case 'punctuation':
                          colorClass = 'text-[#8b949e]'; // subtle punctuation
                          break;
                        case 'variable':
                          colorClass = 'text-[#e6edf3]'; // crisp white
                          break;
                        default:
                          colorClass = 'text-[#c9d1d9]';
                      }

                      return (
                        <span key={tokenIdx} className={colorClass}>
                          {token.text}
                        </span>
                      );
                    })
                  )}
                </div>
              ))}
            </code>
          </pre>

          {/* Interactive Transparent Textarea (Overlayed in Edit Mode) */}
          {isEditing && (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className={`absolute inset-0 w-full h-full p-3 m-0 font-mono text-xs leading-relaxed bg-transparent text-transparent caret-[#58a6ff] resize-none outline-none border-0 overflow-hidden z-10 ${
                wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
              }`}
              style={{
                fontFamily:
                  '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                tabSize: 4,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
