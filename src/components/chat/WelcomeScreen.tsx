import { Brain, Sparkles, TrendingUp, HelpCircle, Search } from 'lucide-react';

const exampleQueries = [
  { icon: TrendingUp, text: 'Top 10 most voted posts', color: 'text-primary' },
  { icon: HelpCircle, text: 'Unreplied questions', color: 'text-warning' },
  { icon: Search, text: 'Research about Zoho API issues', color: 'text-info' },
];

interface Props {
  onQuerySelect: (query: string) => void;
}

export function WelcomeScreen({ onQuerySelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
        <Brain className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to ZDesk Intelligence</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Ask anything about your community forum. Powered by RAG for accurate, context-aware answers.
      </p>
      <div className="grid gap-3 w-full max-w-md">
        {exampleQueries.map((q) => (
          <button
            key={q.text}
            onClick={() => onQuerySelect(q.text)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-left group"
          >
            <q.icon className={`h-5 w-5 ${q.color} shrink-0`} />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              {q.text}
            </span>
            <Sparkles className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
