'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

interface StoryUser {
  userId: string
  userName: string
  userAvatar: string | null
  hasViewed: boolean
  storyCount: number
}

interface StoriesResponse {
  stories: {
    userId: string
    userName: string
    userAvatar: string | null
    hasViewed: boolean
  }[]
}

export function StoryCircles() {
  const router = useRouter()
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const [myHasStory, setMyHasStory] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then((d: { userId?: string } | null) => { if (d?.userId) setMeId(d.userId) }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/social/stories?feed=1')
      .then(r => r.ok ? r.json() : null)
      .then((d: StoriesResponse | null) => {
        if (!d?.stories) return
        // Group by userId, count stories
        const userMap = new Map<string, StoryUser>()
        d.stories.forEach(s => {
          const existing = userMap.get(s.userId)
          if (existing) {
            existing.storyCount++
            if (!s.hasViewed) existing.hasViewed = false
          } else {
            userMap.set(s.userId, {
              userId: s.userId,
              userName: s.userName,
              userAvatar: s.userAvatar,
              hasViewed: s.hasViewed,
              storyCount: 1,
            })
          }
        })
        setStoryUsers(Array.from(userMap.values()))
      }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!meId) return
    fetch(`/api/admin/social/stories?userId=${meId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { stories?: unknown[] } | null) => { if (d?.stories) setMyHasStory(d.stories.length > 0) })
      .catch(() => {})
  }, [meId])

  // Separate own story from others
  const others = storyUsers.filter(u => u.userId !== meId)
  // Sort: unviewed first
  const sorted = [...others].sort((a, b) => Number(a.hasViewed) - Number(b.hasViewed))

  return (
    <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
      {/* My story / Add */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        {myHasStory ? (
          /* Has stories: clicking views them; small + badge to add new */
          <div className="relative w-14 h-14">
            <button
              onClick={() => router.push(`/story/view?userId=${meId}`)}
              className="w-14 h-14"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <span className="text-xs font-bold text-white/70">我</span>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push('/story/create')}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center"
            >
              <Plus className="w-3 h-3 text-slate-900 stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/story/create')}
            className="w-14 h-14"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <Plus className="w-5 h-5 text-white/60" />
            </div>
          </button>
        )}
        <span className="text-[10px] text-white/40">你的</span>
      </div>

      {/* Other users' stories */}
      {sorted.map(user => (
        <div key={user.userId} className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => router.push(`/story/view?userId=${user.userId}`)}
            className="w-14 h-14"
          >
            <div className={`w-14 h-14 rounded-full p-[2px] ${user.hasViewed ? 'bg-white/20' : 'bg-gradient-to-br from-amber-400 via-pink-500 to-purple-500'}`}>
              <div className="w-full h-full rounded-full bg-slate-950 p-0.5 overflow-hidden">
                {user.userAvatar ? (
                  <img src={user.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/70">
                    {user.userName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </button>
          <span className="text-[10px] text-white/40 max-w-[56px] truncate text-center">{user.userName}</span>
        </div>
      ))}

      {sorted.length === 0 && !myHasStory && (
        <p className="text-xs text-white/20 ml-2">目前沒有限時動態</p>
      )}
    </div>
  )
}
