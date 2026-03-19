import { SurveyShell } from '@/components/survey'
import { SurveyCard } from '@/components/survey'
import { MVP_SURVEY } from '@/lib/surveyConfig'
import { getSurveyConfigBySlug } from '@/lib/surveyRepo'
import { MVP_SURVEY_SLUG } from '@/constants'
import { WaitlistForm } from './WaitlistForm'
import { ClickTrackLinks } from './ClickTrackLinks'

export const revalidate = 60

export default async function DonePage() {
  const config = await getSurveyConfigBySlug(MVP_SURVEY_SLUG) ?? MVP_SURVEY

  return (
    <SurveyShell>
      <SurveyCard>
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="text-5xl">🐾</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white/95 leading-snug">
              {config.doneTitle}
            </h1>
            <p className="text-base text-white/60 leading-relaxed">
              {config.doneSubtitle}
            </p>
          </div>

          {/* 封測名單表單 */}
          <div className="space-y-3">
            <p className="text-sm text-white/50">
              留下你的 email，搶先加入封測名單
            </p>
            <WaitlistForm />
          </div>

          <ClickTrackLinks />
        </div>
      </SurveyCard>
    </SurveyShell>
  )
}
