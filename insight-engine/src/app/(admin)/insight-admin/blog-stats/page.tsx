'use client'

import { useState, useEffect } from 'react'
import { Loader2, Eye, MessageSquare, Heart, Users, FileText, Globe, FileLock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  totalArticles: number
  publishedArticles: number
  draftCount: number
  totalViews: number
  totalComments: number
  totalReactions: number
  totalSubscribers: number
}

interface TopArticle {
  id: string
  title: string
  slug: string
  view_count: number
  comment_count: number
  published_at: string
  is_public: boolean
}

interface CategoryItem {
  category: string
  count: number
}

interface TrendItem {
  date: string
  views: number
}

interface StatsData {
  summary: Summary
  topByViews: TopArticle[]
  topByComments: TopArticle[]
  categoryDistribution: CategoryItem[]
  viewsTrend: TrendItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  '技術': 'bg-blue-500/20 text-blue-300',
  '生活': 'bg-green-500/20 text-green-300',
  '心得': 'bg-amber-500/20 text-amber-300',
  '教學': 'bg-purple-500/20 text-purple-300',
  '未分類': 'bg-white/10 text-white/50',
}

function getCategoryStyle(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'bg-white/10 text-white/60'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[#8a7ca8] text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      {sub && <div className="text-xs text-[#6b5fa8]">{sub}</div>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlogStatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/social/blog/stats')
      .then(r => {
        if (!r.ok) throw new Error('載入失敗')
        return r.json() as Promise<StatsData>
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-6 h-6 text-[#8a7ca8] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-rose-400 text-sm">{error ?? '無法載入統計資料'}</div>
    )
  }

  const { summary, topByViews, topByComments, categoryDistribution, viewsTrend } = data

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-lg">📊</span> 文章統計
        </h1>
        <p className="text-sm text-[#6b5fa8] mt-1">你的部落格數據總覽</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-4 h-4" />}
          label="總文章數"
          value={summary.totalArticles}
          sub={`${summary.publishedArticles} 已發布 / ${summary.draftCount} 草稿`}
        />
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label="總瀏覽數"
          value={summary.totalViews}
        />
        <StatCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="總留言數"
          value={summary.totalComments}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="訂閱人數"
          value={summary.totalSubscribers}
          sub={`${summary.totalReactions} 次表情反應`}
        />
      </div>

      {/* Views Trend Chart */}
      {viewsTrend.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
          <h2 className="text-sm font-medium text-[#8a7ca8] mb-4">近 30 天瀏覽趨勢</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewsTrend}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b5fa8', fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b5fa8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1625', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#8a7ca8' }}
                  itemStyle={{ color: '#f5c542' }}
                  formatter={(value) => [String(value), '瀏覽數']}
                  labelFormatter={(label) => `日期：${String(label)}`}
                />
                <Bar dataKey="views" fill="#f5c542" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two-column: Top by Views + Top by Comments */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top by Views */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
          <h2 className="text-sm font-medium text-[#8a7ca8] mb-4 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> 瀏覽數排行
          </h2>
          {topByViews.length === 0 ? (
            <p className="text-sm text-[#6b5fa8] py-4 text-center">尚無文章</p>
          ) : (
            <div className="space-y-3">
              {topByViews.map((a, i) => (
                <ArticleRow key={a.id} article={a} rank={i + 1} metric="views" />
              ))}
            </div>
          )}
        </div>

        {/* Top by Comments */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
          <h2 className="text-sm font-medium text-[#8a7ca8] mb-4 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> 留言數排行
          </h2>
          {topByComments.length === 0 ? (
            <p className="text-sm text-[#6b5fa8] py-4 text-center">尚無文章</p>
          ) : (
            <div className="space-y-3">
              {topByComments.map((a, i) => (
                <ArticleRow key={a.id} article={a} rank={i + 1} metric="comments" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution */}
      {categoryDistribution.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
          <h2 className="text-sm font-medium text-[#8a7ca8] mb-4">分類分布</h2>
          <div className="flex flex-wrap gap-3">
            {categoryDistribution.map(c => (
              <div
                key={c.category}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${getCategoryStyle(c.category)}`}
              >
                {c.category}
                <span className="ml-2 opacity-70">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Article Row ──────────────────────────────────────────────────────────────

function ArticleRow({ article, rank, metric }: {
  article: TopArticle
  rank: number
  metric: 'views' | 'comments'
}) {
  const value = metric === 'views' ? article.view_count : article.comment_count
  const icon = metric === 'views'
    ? <Eye className="w-3 h-3" />
    : <MessageSquare className="w-3 h-3" />

  return (
    <div className="flex items-center gap-3 group">
      <span className="w-5 text-center text-xs font-bold text-[#6b5fa8]">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {article.is_public
            ? <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
            : <FileLock className="w-3 h-3 text-[#6b5fa8] shrink-0" />
          }
          <span className="text-sm text-white truncate">{article.title}</span>
        </div>
        <div className="text-[11px] text-[#6b5fa8] mt-0.5">{formatDate(article.published_at)}</div>
      </div>
      <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0">
        {icon}
        <span>{value.toLocaleString()}</span>
      </div>
    </div>
  )
}
