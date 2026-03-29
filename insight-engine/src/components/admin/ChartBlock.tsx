'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  type PieLabelRenderProps,
} from 'recharts'

/* ─── shared ─── */

const CHART_COLORS = [
  '#b8a9e8', '#f5b8b5', '#a8d8ea', '#a8e8c8',
  '#f5d8a8', '#e8b8d8', '#b8d8f5',
]

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(184,169,232,0.3)',
  borderRadius: '12px',
  color: '#3d3155',
  boxShadow: '0 4px 16px rgba(184,169,232,0.2)',
}

const TICK = { fill: '#8a7ca8', fontSize: 12 }
const AXIS = { stroke: '#d4c8f0' }

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'radar'

const CHART_ICONS: Record<ChartType, string> = {
  bar: '📊',
  line: '📈',
  area: '🏔️',
  pie: '🥧',
  radar: '🕸️',
}

function ChartTypeSwitcher({
  types,
  active,
  onChange,
}: {
  types: ChartType[]
  active: ChartType
  onChange: (t: ChartType) => void
}) {
  return (
    <div className="flex gap-1">
      {types.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            active === t
              ? 'bg-[#b8a9e8]/30 text-[#6b5fa8]'
              : 'bg-[#b8a9e8]/10 text-[#6b5fa8] hover:text-[#6b5fa8]'
          }`}
          title={t}
        >
          {CHART_ICONS[t]}
        </button>
      ))}
    </div>
  )
}

/* ─── inner renderers (label/count data) ─── */

function RenderBarLabel({
  data,
  dataKeyX,
}: {
  data: Record<string, unknown>[]
  dataKeyX: string
}) {
  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,169,232,0.2)" />
      <XAxis dataKey={dataKeyX} tick={TICK} axisLine={AXIS} />
      <YAxis tick={TICK} axisLine={AXIS} />
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      <Bar dataKey="count" fill="#b8a9e8" radius={[4, 4, 0, 0]} />
    </BarChart>
  )
}

function RenderLineLabel({
  data,
  dataKeyX,
}: {
  data: Record<string, unknown>[]
  dataKeyX: string
}) {
  return (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,169,232,0.2)" />
      <XAxis dataKey={dataKeyX} tick={TICK} axisLine={AXIS} />
      <YAxis tick={TICK} axisLine={AXIS} />
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      <Line type="monotone" dataKey="count" stroke="#b8a9e8" strokeWidth={2} dot={{ fill: '#b8a9e8', r: 4 }} />
    </LineChart>
  )
}

function RenderAreaLabel({
  data,
  dataKeyX,
}: {
  data: Record<string, unknown>[]
  dataKeyX: string
}) {
  return (
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,169,232,0.2)" />
      <XAxis dataKey={dataKeyX} tick={TICK} axisLine={AXIS} />
      <YAxis tick={TICK} axisLine={AXIS} />
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#b8a9e8" stopOpacity={0.35} />
          <stop offset="95%" stopColor="#b8a9e8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="count" stroke="#b8a9e8" fill="url(#areaGrad)" strokeWidth={2} />
    </AreaChart>
  )
}

function RenderPieLabel({ data }: { data: { label: string; count: number }[] }) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="count"
        nameKey="label"
        cx="50%"
        cy="50%"
        outerRadius={80}
        label={(props: PieLabelRenderProps) => {
          const name = props.name ?? ''
          const percent = typeof props.percent === 'number' ? props.percent : 0
          return `${name} ${(percent * 100).toFixed(0)}%`
        }}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip contentStyle={TOOLTIP_STYLE} />
    </PieChart>
  )
}

function RenderRadarLabel({ data }: { data: Record<string, unknown>[] }) {
  return (
    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
      <PolarGrid stroke="rgba(184,169,232,0.3)" />
      <PolarAngleAxis dataKey="label" tick={TICK} />
      <PolarRadiusAxis tick={TICK} />
      <Radar dataKey="count" stroke="#b8a9e8" fill="#b8a9e8" fillOpacity={0.25} />
      <Tooltip contentStyle={TOOLTIP_STYLE} />
    </RadarChart>
  )
}

/* ─── exported components ─── */

interface BarChartBlockProps {
  title: string
  data: { label: string; count: number }[]
  defaultType?: ChartType
}

export function BarChartBlock({ title, data, defaultType = 'bar' }: BarChartBlockProps) {
  const [type, setType] = useState<ChartType>(defaultType)
  const types: ChartType[] = ['bar', 'line', 'area', 'pie', 'radar']

  return (
    <div className="rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-[#8a7ca8] font-medium">{title}</h3>
        <ChartTypeSwitcher types={types} active={type} onChange={setType} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        {type === 'bar' ? (
          <RenderBarLabel data={data} dataKeyX="label" />
        ) : type === 'line' ? (
          <RenderLineLabel data={data} dataKeyX="label" />
        ) : type === 'area' ? (
          <RenderAreaLabel data={data} dataKeyX="label" />
        ) : type === 'pie' ? (
          <RenderPieLabel data={data} />
        ) : (
          <RenderRadarLabel data={data} />
        )}
      </ResponsiveContainer>
    </div>
  )
}

interface LineChartBlockProps {
  title: string
  data: { date: string; count: number }[]
  defaultType?: ChartType
}

export function LineChartBlock({ title, data, defaultType = 'line' }: LineChartBlockProps) {
  const [type, setType] = useState<ChartType>(defaultType)
  const types: ChartType[] = ['line', 'area', 'bar']
  const mapped = data.map((d) => ({ label: d.date, count: d.count }))

  return (
    <div className="rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-[#8a7ca8] font-medium">{title}</h3>
        <ChartTypeSwitcher types={types} active={type} onChange={setType} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        {type === 'line' ? (
          <RenderLineLabel data={data} dataKeyX="date" />
        ) : type === 'area' ? (
          <RenderAreaLabel data={data} dataKeyX="date" />
        ) : (
          <RenderBarLabel data={mapped} dataKeyX="label" />
        )}
      </ResponsiveContainer>
    </div>
  )
}

interface PieChartBlockProps {
  title: string
  data: { label: string; count: number }[]
  defaultType?: ChartType
}

export function PieChartBlock({ title, data, defaultType = 'pie' }: PieChartBlockProps) {
  const [type, setType] = useState<ChartType>(defaultType)
  const types: ChartType[] = ['pie', 'bar', 'radar']

  return (
    <div className="rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-[#8a7ca8] font-medium">{title}</h3>
        <ChartTypeSwitcher types={types} active={type} onChange={setType} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        {type === 'pie' ? (
          <RenderPieLabel data={data} />
        ) : type === 'bar' ? (
          <RenderBarLabel data={data} dataKeyX="label" />
        ) : (
          <RenderRadarLabel data={data} />
        )}
      </ResponsiveContainer>
    </div>
  )
}
