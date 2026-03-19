import { SurveyShell } from '@/components/survey'
import { SurveyCard } from '@/components/survey'
import { MVP_SURVEY } from '@/lib/surveyConfig'
import { getSurveyConfigBySlug } from '@/lib/surveyRepo'
import { MVP_SURVEY_SLUG } from '@/constants'
import Link from 'next/link'

export const revalidate = 60

export default async function CoverPage() {
  const config = await getSurveyConfigBySlug(MVP_SURVEY_SLUG) ?? MVP_SURVEY

  return (
    <SurveyShell>
      <SurveyCard>
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white/95 leading-snug">
              {config.coverTitle}
            </h1>
            <p className="text-base text-white/60 leading-relaxed">
              {config.coverSubtitle}
            </p>
          </div>

          <Link
            href="/survey"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] transition-all duration-200"
          >
            {config.startButtonText}
          </Link>

          <p className="text-xs text-white/30">
            共 {config.questions.length} 題，約 2 分鐘完成
          </p>
        </div>
      </SurveyCard>
    </SurveyShell>
  )
}
