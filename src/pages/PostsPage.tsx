import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, FileText } from 'lucide-react';
import type { Post } from '@/types';

const POST_TYPES = ['', 'QUESTION', 'IDEA', 'PROBLEM', 'DISCUSSION', 'ANNOUNCEMENT'];
const STATUSES = ['', 'ANSWERED', 'NOSTATUS', 'NEEDMOREINFO', 'UNDERREVIEW', 'WORKINGONIT', 'IMPLEMENTING', 'IMPLEMENTED', 'ANALYZING', 'SOLVED', 'DECLINED'];

const SORT_OPTIONS = [
  { label: 'Engagement', value: 'engagement_score DESC' },
  { label: 'Likes', value: 'likes DESC' },
  { label: 'Views', value: 'views DESC' },
  { label: 'Comments', value: 'comment_count DESC' },
  { label: 'Newest', value: 'created_at DESC' },
  { label: 'Oldest', value: 'created_at ASC' },
];

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'QUESTION': return 'bg-info/15 text-info border-info/30';
    case 'IDEA': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'PROBLEM': return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'DISCUSSION': return 'bg-muted text-muted-foreground border-border';
    case 'ANNOUNCEMENT': return 'bg-warning/15 text-warning border-warning/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'ANSWERED': case 'SOLVED': case 'IMPLEMENTED':
      return 'bg-success/15 text-success border-success/30';
    case 'NOSTATUS':
      return 'bg-muted text-muted-foreground border-border';
    case 'NEEDMOREINFO': case 'UNDERREVIEW':
      return 'bg-warning/15 text-warning border-warning/30';
    case 'WORKINGONIT': case 'ANALYZING': case 'IMPLEMENTING':
      return 'bg-info/15 text-info border-info/30';
    case 'DECLINED':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export default function PostsPage() {
  const [search, setSearch] = useState('');
  const [postType, setPostType] = useState('');
  const [status, setStatus] = useState('');
  const [unreplied, setUnreplied] = useState(false);
  const [orderBy, setOrderBy] = useState('engagement_score DESC');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['posts', postType, status, unreplied, orderBy, offset],
    queryFn: () => fetchPosts({ limit, offset, order_by: orderBy, post_type: postType, label: status, unreplied }),
  });

  const filtered = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Forum Posts</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 bg-secondary/50"
        />
        <Select value={postType} onValueChange={v => { setPostType(v === 'ALL' ? '' : v); setOffset(0); }}>
          <SelectTrigger className="w-40 bg-secondary/50"><SelectValue placeholder="Post Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {POST_TYPES.filter(Boolean).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v === 'ALL' ? '' : v); setOffset(0); }}>
          <SelectTrigger className="w-44 bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.filter(Boolean).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={orderBy} onValueChange={v => { setOrderBy(v); setOffset(0); }}>
          <SelectTrigger className="w-40 bg-secondary/50"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="unreplied" checked={unreplied} onCheckedChange={v => { setUnreplied(v); setOffset(0); }} />
          <Label htmlFor="unreplied" className="text-sm text-muted-foreground">Unreplied only</Label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground w-28">Type</TableHead>
              <TableHead className="text-muted-foreground w-32">Status</TableHead>
              <TableHead className="text-muted-foreground w-16 text-right">Likes</TableHead>
              <TableHead className="text-muted-foreground w-16 text-right">Views</TableHead>
              <TableHead className="text-muted-foreground w-20 text-right">Comments</TableHead>
              <TableHead className="text-muted-foreground w-28">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No posts found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(post => (
                <TableRow
                  key={post.id}
                  className={`hover:bg-secondary/30 transition-colors ${post.unreplied ? 'border-l-2 border-l-destructive' : ''}`}
                >
                  <TableCell>
                    <a
                      href={post.topic_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <span className="line-clamp-1">{post.title}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getTypeBadgeClass(post.post_type)}`}>
                      {post.post_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(post.label)}`}>
                      {post.label || 'NOSTATUS'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{post.likes}</TableCell>
                  <TableCell className="text-right text-sm">{post.views}</TableCell>
                  <TableCell className="text-right text-sm">{post.comment_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {Math.floor(offset / limit) + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={posts.length < limit}
          onClick={() => setOffset(offset + limit)}
        >
          Load more
        </Button>
      </div>
    </div>
  );
}
