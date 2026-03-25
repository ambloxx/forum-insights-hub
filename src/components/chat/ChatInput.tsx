import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Globe, BookOpen, Sparkles, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
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

  const modeConfig = {
    deep_research: { icon: BookOpen, label: 'Deep Research', color: 'text-primary' },
    url_read: { icon: Globe, label: 'URL Reading', color: 'text-info' },
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Main input container — Claude style rounded card */}
        <div className="relative rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:border-primary/30">
          {/* Active mode pill */}
          {mode !== 'default' && (
            <div className="flex items-center gap-2 px-4 pt-3 pb-0">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 ${modeConfig[mode].color}`}>
                {(() => { const Icon = modeConfig[mode].icon; return <Icon className="h-3 w-3" />; })()}
                {modeConfig[mode].label}
                <button
                  onClick={() => setMode('default')}
                  className="ml-1 hover:text-foreground transition-colors"
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
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1">
              {/* Deep Research toggle */}
              <button
                onClick={() => setMode(m => m === 'deep_research' ? 'default' : 'deep_research')}
                disabled={isStreaming}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  mode === 'deep_research'
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } disabled:opacity-40`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Deep Research</span>
              </button>

              {/* URL Read toggle */}
              <button
                onClick={() => setMode(m => m === 'url_read' ? 'default' : 'url_read')}
                disabled={isStreaming}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  mode === 'url_read'
                    ? 'bg-info/15 text-info'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } disabled:opacity-40`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Read URL</span>
              </button>
            </div>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!value.trim() || isStreaming}
              size="icon"
              className="h-8 w-8 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 transition-all duration-200"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {suggestions.map(q => (
            <button
              key={q}
              onClick={() => onSend(q)}
              disabled={isStreaming}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted hover:border-muted-foreground/20 transition-all duration-200 disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
