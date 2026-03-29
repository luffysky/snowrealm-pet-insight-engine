'use client'

import dynamic from 'next/dynamic'

const YukirinWidget = dynamic(() => import('./YukirinWidget'), { ssr: false })

export default function YukirinWidgetLoader() {
  return <YukirinWidget />
}
