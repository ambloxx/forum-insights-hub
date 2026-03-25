import { Sparkles, ArrowRight, TrendingUp, HelpCircle, Search, BarChart3, BookOpen } from 'lucide-react';

const exampleQueries = [
  { icon: TrendingUp, text: 'Top 10 most voted posts', description: 'See the most popular forum discussions' },
  { icon: HelpCircle, text: 'Unreplied questions', description: 'Find questions awaiting community response' },
  { icon: BarChart3, text: 'Forum statistics overview', description: 'Get a summary of forum activity and health' },
  { icon: Search, text: 'Research about Zoho API issues', description: 'Deep dive into API-related problems' },
  { icon: BookOpen, text: 'Why are posts going unreplied?', description: 'Analyze patterns in unanswered questions' },
];

interface Props {
  onQuerySelect: (query: string) => void;
}

export function WelcomeScreen({ onQuerySelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo + Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border  mb-2">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            ZDesk Intelligence
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            Your AI-powered forum analyst. Ask questions, explore data, and uncover insights.
          </p>
        </div>

        {/* Example queries as cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {exampleQueries.map((q, i) => (
            <button
              key={q.text}
              onClick={() => onQuerySelect(q.text)}
              className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20 transition-all duration-200 text-left animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mt-0.5 group-hover:bg-primary/15 transition-colors">
                <q.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {q.text}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {q.description}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 mt-1 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
