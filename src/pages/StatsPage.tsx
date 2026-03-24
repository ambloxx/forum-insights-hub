import { useQuery } from '@tanstack/react-query';
import { fetchStats, fetchPosts } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, AlertCircle, Heart, Eye, MessageSquare, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { StatsData, PostsResponse } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  QUESTION: 'hsl(199, 89%, 48%)',
  IDEA: 'hsl(280, 65%, 60%)',
  PROBLEM: 'hsl(0, 84%, 60%)',
  DISCUSSION: 'hsl(142, 76%, 36%)',
  ANNOUNCEMENT: 'hsl(38, 92%, 50%)',
};

const LABEL_COLORS: Record<string, string> = {
  IMPLEMENTED: 'hsl(239, 84%, 67%)',
  ANSWERED: 'hsl(142, 76%, 36%)',
  SOLVED: 'hsl(142, 76%, 36%)',
  WORKINGONIT: 'hsl(38, 92%, 50%)',
  NEEDMOREINFO: 'hsl(38, 92%, 50%)',
  UNDERREVIEW: 'hsl(280, 65%, 60%)',
  ANALYZING: 'hsl(199, 89%, 48%)',
  NOSTATUS: 'hsl(215, 20%, 55%)',
  DECLINED: 'hsl(0, 84%, 60%)',
};

const CHART_COLORS = [
  'hsl(239, 84%, 67%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 65%, 60%)',
  'hsl(199, 89%, 48%)',
];

const fmt = (n: number | undefined | null) =>
  n == null ? '0' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toLocaleString();

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: topPostsData } = useQuery<PostsResponse>({
    queryKey: ['topPosts'],
    queryFn: () => fetchPosts({ order_by: 'engagement_score DESC', limit: 10 }),
  });

  const topPosts = topPostsData?.posts || [];

  if (isLoading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold text-foreground">Forum Statistics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="h-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const resolvedPct = stats.resolution_rate_pct ?? (stats.total_posts > 0 ? ((stats.resolved_posts / stats.total_posts) * 100).toFixed(1) : '0');
  const unrepliedPct = stats.total_posts > 0 ? ((stats.unreplied_posts / stats.total_posts) * 100).toFixed(1) : '0';
  const unrepliedWarn = parseFloat(String(unrepliedPct)) > 10;

  // Handle both array format (from API) and object format
  const typeData = Array.isArray(stats.breakdown_by_type)
    ? stats.breakdown_by_type.map(d => ({ name: d.type, value: d.count }))
    : Object.entries((stats as any).by_type || {}).map(([name, value]) => ({ name, value: value as number }));

  const labelData = Array.isArray(stats.breakdown_by_label)
    ? stats.breakdown_by_label.map(d => ({ name: d.label, value: d.count }))
    : Object.entries((stats as any).by_label || {}).map(([name, value]) => ({ name, value: value as number }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Forum Statistics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(stats.total_posts)}</div>
            <p className="text-xs text-muted-foreground mt-1">Indexed in database</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(stats.resolved_posts)}</div>
            <Badge variant="secondary" className="text-xs mt-1">{resolvedPct}% resolution</Badge>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unreplied</CardTitle>
            <AlertCircle className={`h-4 w-4 ${unrepliedWarn ? 'text-warning' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unrepliedWarn ? 'text-warning' : 'text-foreground'}`}>
              {fmt(stats.unreplied_posts)}
            </div>
            <Badge variant={unrepliedWarn ? 'destructive' : 'secondary'} className="text-xs mt-1">
              {unrepliedPct}% awaiting response
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Peak Engagement</CardTitle>
            <Heart className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(stats.max_likes)}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg {(stats.avg_likes || 0).toFixed(1)} likes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Posts by Type - Donut */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Posts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={0}>
                      {typeData.map((d, i) => (
                        <Cell key={i} fill={TYPE_COLORS[d.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 25%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {typeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[d.name] || CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="text-foreground font-medium">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Posts by Status - Bar */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Posts by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {labelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={labelData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 25%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {labelData.map((d, i) => (
                      <Cell key={i} fill={LABEL_COLORS[d.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Resolution Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Resolved', value: stats.resolved_posts, total: stats.total_posts, color: 'hsl(142, 76%, 36%)' },
                { label: 'Unreplied', value: stats.unreplied_posts, total: stats.total_posts, color: 'hsl(38, 92%, 50%)' },
                { label: 'Unresolved', value: stats.unresolved_posts || (stats.total_posts - stats.resolved_posts), total: stats.total_posts, color: 'hsl(0, 84%, 60%)' },
              ].map(item => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-mono text-foreground">{fmt(item.value)} ({item.total ? Math.round(item.value / item.total * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / (item.total || 1)) * 100}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Likes</CardTitle>
            <Heart className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(stats.max_likes)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Views</CardTitle>
            <Eye className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(stats.max_views)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{(stats.avg_comments || 0).toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts Table */}
      {topPosts.length > 0 && (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Posts by Engagement</CardTitle>
            <Badge variant="secondary" className="text-xs">Top {topPosts.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-muted-foreground w-10">#</TableHead>
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-muted-foreground w-24">Type</TableHead>
                  <TableHead className="text-muted-foreground w-28">Status</TableHead>
                  <TableHead className="text-muted-foreground w-16 text-right">Likes</TableHead>
                  <TableHead className="text-muted-foreground w-16 text-right">Views</TableHead>
                  <TableHead className="text-muted-foreground w-20 text-right">Replies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPosts.map((p, i) => (
                  <TableRow
                    key={p.id || i}
                    className="hover:bg-secondary/30 cursor-pointer transition-colors"
                    onClick={() => p.topic_url && window.open(p.topic_url, '_blank')}
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground truncate max-w-xs">{p.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]" style={{ color: TYPE_COLORS[p.type], borderColor: TYPE_COLORS[p.type] + '50' }}>
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]" style={{ color: LABEL_COLORS[p.label], borderColor: (LABEL_COLORS[p.label] || '') + '50' }}>
                        {p.label || 'NOSTATUS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(p.like_count)}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(p.view_count)}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(p.comment_count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
