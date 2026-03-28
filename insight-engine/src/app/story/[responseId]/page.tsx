import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { StoryCardData } from '@/lib/storyCardEngine'
import { CopyLinkButton } from './CopyLinkButton'

async function fetchCard(responseId: string): Promise<StoryCardData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/story-card/${responseId}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<StoryCardData>
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ responseId: string }> }
): Promise<Metadata> {
  const { responseId } = await params
  const card = await fetchCard(responseId)
  if (!card) return { title: 'Not Found' }

  return {
    title: `${card.surveyTitle} — 我的故事卡片`,
    description: card.shareableOneLiner,
    openGraph: {
      title: `${card.surveyTitle} — 我的故事卡片`,
      description: card.shareableOneLiner,
      type: 'article',
    },
  }
}

export default async function PublicStoryCardPage(
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { responseId } = await params
  const card = await fetchCard(responseId)
  if (!card) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
  const shareUrl = `${baseUrl}/story/${responseId}`

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Story Card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top left, #818cf840, transparent 60%)' }} />
          <div className="relative p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-2xl">✨</div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">{card.surveyTitle}</p>
            </div>
            <div className="border-t border-white/8" />
            {card.personalFacts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 font-semibold tracking-wider uppercase">你的選擇</p>
                <ul className="space-y-1.5">
                  {card.personalFacts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
                      <span className="shrink-0 mt-0.5 text-[10px] text-indigo-400">▸</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.groupComparisons.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 font-semibold tracking-wider uppercase">與大家比較</p>
                <ul className="space-y-1.5">
                  {card.groupComparisons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-indigo-300/80 leading-relaxed">
                      <span className="shrink-0">👥</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.shareableOneLiner && (
              <div className="rounded-xl px-4 py-3 border bg-indigo-500/10 border-indigo-500/30 text-center">
                <p className="text-xs text-white/80 italic leading-relaxed">「{card.shareableOneLiner}」</p>
              </div>
            )}
            <div className="border-t border-white/8" />
            <div className="text-center space-y-0.5">
              <p className="text-[10px] text-white/20 font-medium">SnowRealm Insight Engine</p>
              <p className="text-[9px] text-white/15">insight.snowrealm.pet</p>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex justify-center gap-3 flex-wrap">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#06C755] hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity"
          >
            💬 分享到 LINE
          </a>
          <CopyLinkButton url={shareUrl} />
        </div>

        {/* CTA */}
        <div className="text-center space-y-2 pt-4 border-t border-white/10">
          <p className="text-sm text-white/50">想填這份問卷？</p>
          <a
            href={`${baseUrl}/survey/${card.surveySlug}`}
            className="inline-block px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            ✍️ 去填答
          </a>
        </div>
      </div>
    </div>
  )
}
