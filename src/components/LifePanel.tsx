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
  const edition = stats.updatedAt.slice(0, 7);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
      {/* ===== 刊头 ===== */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-neutral-200 pb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#c2543e]">Life System</p>
          <h1 className="font-display mt-4 text-4xl font-black tracking-tight text-neutral-900 sm:text-6xl">
            地球online 面板
          </h1>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold tabular-nums text-neutral-900">{edition}</p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.3em] text-neutral-400">时间</p>
        </div>
      </header>

      {/* ===== 总览 ===== */}
      <section className="mt-12 grid grid-cols-2 gap-10 sm:max-w-lg">
        <div>
          <div className="text-5xl font-light tabular-nums text-neutral-900 sm:text-6xl">
            {totalPoints.toLocaleString()}
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-neutral-400">累计总点数</div>
        </div>
        <div className="border-l border-neutral-200 pl-10">
          <div className="font-display text-5xl font-bold tabular-nums text-[#c2543e] sm:text-6xl">
            Lv.{totalLevel}
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-neutral-400">综合等级</div>
        </div>
      </section>

      {/* ===== 属性卡片 ===== */}
      <section className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ATTRIBUTES.map((attr) => (
          <AttributeCard
            key={attr.key}
            attr={attr}
            points={stats.attributes[attr.key]?.points ?? 0}
            yesterday={lastDay ? Number(lastDay[attr.key] ?? 0) : 0}
            active={activeKey === attr.key}
            onClick={() => setActiveKey(activeKey === attr.key ? null : attr.key)}
          />
        ))}
      </section>

      {/* ===== 近 7 日成长记录 ===== */}
      <section className="mt-16">
        <div className="border-b border-neutral-200 pb-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
            近 7 日成长记录
          </h2>
        </div>
        {recentDays.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">暂无记录，明天开始积累吧。</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentDays.map((d) => (
              <li key={d.date} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-3.5">
                <span className="w-14 shrink-0 text-sm tabular-nums text-neutral-500">
                  {d.date.slice(5)}
                </span>
                <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1">
                  {ATTRIBUTES.map((attr) => {
                    const v = d[attr.key] ?? 0;
                    return (
                      <span key={attr.key} className="flex items-center gap-1.5 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: attr.color }} />
                        <span
                          className="tabular-nums font-medium"
                          style={{ color: v > 0 ? attr.color : '#a3a3a3' }}
                        >
                          {v > 0 ? `+${v}` : '—'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== 页脚 ===== */}
      <footer className="mt-20 border-t border-neutral-200 pt-8 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e]" />
          数据同步于 {stats.updatedAt}
          {lastDay ? <span className="text-neutral-400">· 最近记录 {lastDay.date}</span> : null}
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-neutral-400">
          数据来源：滴答清单 · 按标签完成数累计 · 每日 03:00（北京时间）自动同步构建
        </p>
      </footer>
    </main>
  );
}
