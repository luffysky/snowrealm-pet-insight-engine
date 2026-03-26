import type { GapSnapshot } from './cognitiveGapEngine'

function snapshotSummary(snapshots: GapSnapshot[]): string {
  return snapshots.map(s => {
    const dir = s.gapScore > 0 ? '高估自己' : s.gapScore < 0 ? '低估自己' : '準確'
    return `特質「${s.traitKey}」：自評 ${s.selfScore}/100，他人平均 ${s.othersAvgScore}/100，落差 ${s.gapScore > 0 ? '+' : ''}${s.gapScore}（${dir}，${s.responseCount} 人評價）`
  }).join('\n')
}

const STYLE_META = {
  A: { name: '溫柔療癒型', tone: '溫暖、包容、像一封給自己的信', length: '250-350字' },
  B: { name: '刺痛覺醒型', tone: '直接、犀利、讓人有點不舒服但想繼續讀', length: '200-300字' },
  C: { name: '小說劇場型', tone: '第三人稱敘事、像短篇小說開場', length: '300-400字' },
  D: { name: '商業洞察型', tone: '簡潔、數據導向、像顧問報告摘要', length: '200-280字' },
  E: { name: '顧問行動型', tone: '具體建議、給3個可立即執行的改變', length: '280-380字' },
}

export function gapPrompt(
  styleKey: 'A' | 'B' | 'C' | 'D' | 'E',
  snapshots: GapSnapshot[]
): string {
  const meta = STYLE_META[styleKey]
  const summary = snapshotSummary(snapshots)
  const overallGap = snapshots.reduce((sum, s) => sum + Math.abs(s.gapScore), 0) / Math.max(snapshots.length, 1)
  const biggestGap = [...snapshots].sort((a, b) => Math.abs(b.gapScore) - Math.abs(a.gapScore))[0]

  return `你是一位專業的人際關係心理分析師。根據以下認知落差數據，用「${meta.name}」風格（${meta.tone}）寫一段 ${meta.length} 的繁體中文分析。

認知落差數據：
${summary}

整體落差指數：${overallGap.toFixed(1)}
最大落差特質：${biggestGap?.traitKey ?? '—'}（自評 ${biggestGap?.selfScore}，他人 ${biggestGap?.othersAvgScore}）

${styleKey === 'A' ? '從理解和包容的角度，幫助讀者接納自己與他人眼中的差異。結尾給予一個溫柔的鼓勵。' : ''}
${styleKey === 'B' ? '直接點出最大的認知盲點，用稍微刺痛但誠實的語氣讓讀者正視。不要過度安慰。' : ''}
${styleKey === 'C' ? '用第三人稱「他/她」開始，像一個短篇小說的開場，描述這個人在人際關係中的處境。' : ''}
${styleKey === 'D' ? '用條列式分析主要落差，提供數據解讀，最後一句話給出商業建議。避免情緒化。' : ''}
${styleKey === 'E' ? '直接給出3個具體可執行的改善行動，每個行動要具體到「明天就能做」的程度。' : ''}

只輸出分析本文，不要標題、不要前言、不要解釋自己在做什麼。`
}
