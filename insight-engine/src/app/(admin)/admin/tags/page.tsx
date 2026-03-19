import { getTagDistribution } from '@/lib/stats'
import { TagChart } from '@/components/admin'

export const dynamic = 'force-dynamic'

const TAG_GROUPS = [
  { key: 'emotion_level', title: '情感等級分佈' },
  { key: 'payment_intent', title: '付費意願分佈' },
  { key: 'loss_status', title: '寵物離世經驗' },
  { key: 'pet_owner_status', title: '飼主狀態' },
  { key: 'engagement_potential', title: '參與潛力' },
  { key: 'record_habit', title: '記錄習慣' },
  { key: 'memorial_need', title: '紀念需求' },
  { key: 'revisit_frequency', title: '回看頻率' },
]

export default async function AdminTagsPage() {
  const distributions = await getTagDistribution()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">CRM 標籤統計</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TAG_GROUPS.map(({ key, title }) => (
          <TagChart
            key={key}
            title={title}
            distributions={distributions}
            filterKey={key}
          />
        ))}
      </div>
    </div>
  )
}
