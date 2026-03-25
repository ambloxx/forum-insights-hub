import { useState, useRef, useEffect } from 'react';
import { ArrowUp, BookOpen, Globe } from 'lucide-react';

interface Props {
  onSend: (message: string, mode?: 'default' | 'deep_research' | 'url_read') => void;
  isStreaming: boolean;
}

const suggestions = [
  'Top 10 most voted posts',
  'Unreplied questions',
  'Forum statistics overview',
  'Research about Zoho API issues',
  'Why are posts going unreplied?',
];

export function ChatInput({ onSend, isStreaming }: Props) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<'default' | 'deep_research' | 'url_read'>('default');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed, mode);
    setValue('');
    setMode('default');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="max-w-[680px] mx-auto space-y-3">
        {/* Input area — minimal, no card border */}
        <div className="relative rounded-2xl bg-muted/50 transition-all duration-200 focus-within:bg-muted/70 focus-within:ring-1 focus-within:ring-border">
          {/* Active mode indicator */}
          {mode !== 'default' && (
            <div className="flex items-center gap-2 px-4 pt-3">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${
                mode === 'deep_research'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-info/10 text-info'
              }`}>
                {mode === 'deep_research' ? <BookOpen className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {mode === 'deep_research' ? 'Deep Research' : 'URL Reading'}
                <button
                  onClick={() => setMode('default')}
                  className="ml-1 hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your forum..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '180px' }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setMode(m => m === 'deep_research' ? 'default' : 'deep_research')}
                disabled={isStreaming}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                  mode === 'deep_research'
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } disabled:opacity-30`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Deep Research
              </button>

              <button
                onClick={() => setMode(m => m === 'url_read' ? 'default' : 'url_read')}
                disabled={isStreaming}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                  mode === 'url_read'
                    ? 'bg-info/12 text-info'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } disabled:opacity-30`}
              >
                <Globe className="h-3.5 w-3.5" />
                Read URL
              </button>
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!value.trim() || isStreaming}
              className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-85 disabled:opacity-20 transition-all duration-150"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {suggestions.map(q => (
            <button
              key={q}
              onClick={() => onSend(q)}
              disabled={isStreaming}
              className="text-[12px] px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all duration-150 disabled:opacity-30"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
