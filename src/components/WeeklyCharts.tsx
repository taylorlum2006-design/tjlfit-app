import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { brand } from '../brand'
import type { DailyCheckin } from '../types'
import { weeklyAverages } from '../lib/stats'
import { toDisplay, type Units } from '../lib/units'
import { Card, CardTitle, Empty } from './ui'

const axis = { stroke: brand.colors.mute, fontSize: 11, tickLine: false, axisLine: false }
const tip = {
  contentStyle: { background: brand.colors.raised, border: `1px solid ${brand.colors.line}`, borderRadius: 12, color: brand.colors.text, fontSize: 13 },
  labelStyle: { color: brand.colors.mute, marginBottom: 2 },
  cursor: { fill: 'rgba(255,255,255,.04)', stroke: brand.colors.line },
}

export function WeightChart({ rows, units }: { rows: DailyCheckin[]; units: Units }) {
  const data = weeklyAverages(rows, 'weight').map(d => ({ ...d, value: +(toDisplay(d.value, units)!).toFixed(1) }))
  const first = data[0]?.value, last = data[data.length - 1]?.value
  return (
    <Card>
      <CardTitle right={data.length > 1 && <span className="text-sm text-mute">{last! - first! > 0 ? '+' : ''}{(last! - first!).toFixed(1)} {units} over {data.length} weeks</span>}>Weekly average weight</CardTitle>
      {data.length < 1 ? <Empty>Log a few morning weights and your weekly trend shows here.</Empty> : (
        <div className="h-56 -ml-3">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={brand.colors.line} vertical={false} />
              <XAxis dataKey="label" {...axis} minTickGap={16} />
              <YAxis {...axis} width={44} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={v => Number(v).toFixed(0)} />
              <Tooltip {...tip} formatter={(v: any, _n: any, p: any) => [`${v} ${units} (${p.payload.days} days)`, 'Average']} labelFormatter={l => `Week of ${l}`} />
              <Line type="monotone" dataKey="value" stroke={brand.colors.gold} strokeWidth={2.5} dot={{ r: 3, fill: brand.colors.gold, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export function StepsChart({ rows, goal }: { rows: DailyCheckin[]; goal: number }) {
  const data = weeklyAverages(rows, 'steps').map(d => ({ ...d, value: Math.round(d.value) }))
  return (
    <Card>
      <CardTitle right={<span className="text-sm text-mute">goal {goal.toLocaleString()}</span>}>Weekly average steps</CardTitle>
      {data.length < 1 ? <Empty>Log your daily steps and your weekly average shows here.</Empty> : (
        <div className="h-56 -ml-3">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={brand.colors.line} vertical={false} />
              <XAxis dataKey="label" {...axis} minTickGap={16} />
              <YAxis {...axis} width={44} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip {...tip} formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString()} steps (${p.payload.days} days)`, 'Average']} labelFormatter={l => `Week of ${l}`} />
              <ReferenceLine y={goal} stroke={brand.colors.text} strokeOpacity={0.5} strokeDasharray="4 4" />
              <Bar dataKey="value" fill={brand.colors.gold} radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
