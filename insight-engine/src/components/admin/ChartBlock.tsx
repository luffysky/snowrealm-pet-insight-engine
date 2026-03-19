'use client'

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
  type PieLabelRenderProps,
} from 'recharts'

interface BarChartBlockProps {
  title: string
  data: { label: string; count: number }[]
}

const CHART_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#34d399',
  '#fbbf24', '#fb923c', '#60a5fa',
]

export function BarChartBlock({ title, data }: BarChartBlockProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <h3 className="text-sm text-slate-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LineChartBlockProps {
  title: string
  data: { date: string; count: number }[]
}

export function LineChartBlock({ title, data }: LineChartBlockProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <h3 className="text-sm text-slate-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ fill: '#a78bfa', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PieChartBlockProps {
  title: string
  data: { label: string; count: number }[]
}

export function PieChartBlock({ title, data }: PieChartBlockProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <h3 className="text-sm text-slate-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
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
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
