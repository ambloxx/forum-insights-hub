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
import { ExternalLink, FileText, Heart, Eye, MessageSquare } from 'lucide-react';
import type { Post, PostsResponse } from '@/types';

const POST_TYPES = ['QUESTION', 'IDEA', 'PROBLEM', 'DISCUSSION', 'ANNOUNCEMENT'];
const STATUSES = ['ANSWERED', 'NOSTATUS', 'NEEDMOREINFO', 'UNDERREVIEW', 'WORKINGONIT', 'IMPLEMENTING', 'IMPLEMENTED', 'ANALYZING', 'SOLVED', 'DECLINED'];

const SORT_OPTIONS = [
  { label: 'Engagement',       value: 'engagement_score DESC' },
  { label: 'Most Votes',       value: 'like_count DESC' },
  { label: 'Most Views',       value: 'view_count DESC' },
  { label: 'Most Replies',     value: 'comment_count DESC' },
  { label: 'Newest',           value: 'created_time DESC' },
  { label: 'Oldest',           value: 'created_time ASC' },
  { label: 'Recently Updated', value: 'latest_comment_time DESC' },
];

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'QUESTION':     return 'bg-info/15 text-info border-info/30';
    case 'IDEA':         return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'PROBLEM':      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'DISCUSSION':   return 'bg-muted text-muted-foreground border-border';
    case 'ANNOUNCEMENT': return 'bg-warning/15 text-warning border-warning/30';
    default:             return 'bg-muted text-muted-foreground border-border';
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

function formatLabel(label: string) {
  switch (label) {
    case 'WORKINGONIT':  return 'Working On It';
    case 'NEEDMOREINFO': return 'Need More Info';
    case 'UNDERREVIEW':  return 'Under Review';
    case 'NOSTATUS':     return 'No Status';
    default: return label ? label.charAt(0) + label.slice(1).toLowerCase() : 'No Status';
  }
}

function timeAgo(iso: string) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)      return 'just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' :
  n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' :
  n.toLocaleString();

export default function PostsPage() {
  const [search,   setSearch]   = useState('');
  const [postType, setPostType] = useState('');
  const [status,   setStatus]   = useState('');
  const [unreplied, setUnreplied] = useState(false);
  const [orderBy,  setOrderBy]  = useState('engagement_score DESC');
  const [offset,   setOffset]   = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery<PostsResponse>({
    queryKey: ['posts', postType, status, unreplied, orderBy, offset],
    queryFn: () => fetchPosts({ limit, offset, order_by: orderBy, post_type: postType, label: status, unreplied }),
  });

  const posts    = data?.posts ?? [];
  const total    = data?.total ?? 0;
  const filtered = search
    ? posts.filter(p => (p.subject ?? '').toLowerCase().includes(search.toLowerCase()))
    : posts;

  const page       = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Forum Posts</h1>
        <span className="text-xs text-muted-foreground">{total.toLocaleString()} posts</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 bg-secondary/50"
        />
        <Select value={postType || 'ALL'} onValueChange={v => { setPostType(v === 'ALL' ? '' : v); setOffset(0); }}>
          <SelectTrigger className="w-40 bg-secondary/50"><SelectValue placeholder="Post Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {POST_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || 'ALL'} onValueChange={v => { setStatus(v === 'ALL' ? '' : v); setOffset(0); }}>
          <SelectTrigger className="w-44 bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={orderBy} onValueChange={v => { setOrderBy(v); setOffset(0); }}>
          <SelectTrigger className="w-44 bg-secondary/50"><SelectValue placeholder="Sort by" /></SelectTrigger>
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
              <TableHead className="text-muted-foreground">Subject</TableHead>
              <TableHead className="text-muted-foreground w-28">Type</TableHead>
              <TableHead className="text-muted-foreground w-32">Status</TableHead>
              <TableHead className="text-muted-foreground w-20 text-right">
                <span className="flex items-center justify-end gap-1"><Heart className="h-3 w-3" />Likes</span>
              </TableHead>
              <TableHead className="text-muted-foreground w-20 text-right">
                <span className="flex items-center justify-end gap-1"><Eye className="h-3 w-3" />Views</span>
              </TableHead>
              <TableHead className="text-muted-foreground w-20 text-right">
                <span className="flex items-center justify-end gap-1"><MessageSquare className="h-3 w-3" />Replies</span>
              </TableHead>
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
              filtered.map(post => {
                // Use topic_url directly — set by normalizer from the permalink field
                // Format: https://help.zoho.com/portal/en/community/topic/${permalink}
                const url = `https://help.zoho.com/portal/en/community/topic/${post.permalink}`;
                const lastActivity = post.latest_comment_time || post.created_time;

                return (
                  <TableRow
                    key={post.id}
                    className={`hover:bg-secondary/30 transition-colors ${url ? 'cursor-pointer' : ''} ${post.is_unreplied ? 'border-l-2 border-l-destructive' : ''}`}
                    onClick={() => url && window.open(url, '_blank')}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group line-clamp-1 font-medium">
                          {post.subject || 'Untitled'}
                          {url && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />}
                        </span>
                        {post.creator_name && (
                          <span className="text-[11px] text-muted-foreground">
                            by {post.creator_name} · {timeAgo(lastActivity)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getTypeBadgeClass(post.type)}`}>
                        {post.type ? post.type.charAt(0) + post.type.slice(1).toLowerCase() : 'Post'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(post.label)}`}>
                        {formatLabel(post.label || 'NOSTATUS')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(post.like_count ?? 0)}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(post.view_count ?? 0)}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(post.comment_count ?? 0)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {post.created_time ? post.created_time.slice(0, 10) : ''}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {totalPages > 1 && `Page ${page} of ${totalPages}`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={posts.length < limit}
            onClick={() => setOffset(offset + limit)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}