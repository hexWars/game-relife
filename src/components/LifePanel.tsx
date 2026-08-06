import { useState } from 'react';
import type { StatsFile } from '../lib/types';
import { ATTRIBUTES } from '../lib/attributes';
import { levelFromPoints } from '../lib/levels';
import AttributeCard from './AttributeCard';

interface LifePanelProps {
  stats: StatsFile;
}

export default function LifePanel({ stats }: LifePanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const totalPoints = Object.values(stats.attributes).reduce((sum, a) => sum + a.points, 0);
  const totalLevel = levelFromPoints(totalPoints);
  const lastDay = stats.history[stats.history.length - 1];
  const recentDays = [...stats.history].reverse().slice(0, 7);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
      {/* ===== 顶栏 ===== */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.45em] text-slate-500">
            Life System
          </div>
          <h1 className="font-display mt-2 text-4xl font-black tracking-wide text-white sm:text-5xl">
            游戏化
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              面板
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
            <div className="font-display text-2xl font-black text-cyan-300">{totalPoints}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">总点数</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
            <div className="font-display text-2xl font-black text-amber-300">Lv.{totalLevel}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">综合等级</div>
          </div>
        </div>
      </header>

      {/* ===== 同步状态 ===== */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        数据同步于 {stats.updatedAt}
        {lastDay ? <span className="text-slate-500">· 最近记录 {lastDay.date}</span> : null}
      </div>

      {/* ===== 属性卡片 ===== */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ATTRIBUTES.map((attr) => (
          <AttributeCard
            key={attr.key}
            attr={attr}
            points={stats.attributes[attr.key]?.points ?? 0}
            today={lastDay ? Number(lastDay[attr.key] ?? 0) : 0}
            active={activeKey === attr.key}
            onClick={() => setActiveKey(activeKey === attr.key ? null : attr.key)}
          />
        ))}
      </section>

      {/* ===== 近 7 日成长记录 ===== */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-display mb-4 text-sm uppercase tracking-widest text-slate-400">
          近 7 日成长记录
        </h2>
        <div className="space-y-2">
          {recentDays.length === 0 ? (
            <p className="text-sm text-slate-500">暂无记录，明天开始积累吧。</p>
          ) : (
            recentDays.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-sm">
                <span className="font-display w-24 shrink-0 text-xs text-slate-400">{d.date}</span>
                <div className="flex flex-1 flex-wrap gap-4">
                  {ATTRIBUTES.map((attr) => (
                    <span key={attr.key} className="flex items-center gap-1">
                      <span>{attr.icon}</span>
                      <span className="font-display text-xs" style={{ color: attr.color }}>
                        {d[attr.key] ?? 0}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="pb-4 text-center text-xs text-slate-600">
        数据来源：滴答清单 · 按标签完成数累计 · 每日 03:00（北京时间）自动同步构建
      </footer>
    </main>
  );
}
