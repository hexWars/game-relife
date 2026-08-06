import type { AttributeDef } from '../lib/attributes';
import { getLevelInfo } from '../lib/levels';

interface AttributeCardProps {
  attr: AttributeDef;
  points: number;
  today: number;
  active: boolean;
  onClick: () => void;
}

export default function AttributeCard({ attr, points, today, active, onClick }: AttributeCardProps) {
  const { level, currentThreshold, nextThreshold, progress } = getLevelInfo(points);
  const pct = Math.round(progress * 100);
  const barWidth = Math.max(pct, 3); // 保留最小可见长度

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-left backdrop-blur transition-all duration-300 ${
        active ? 'scale-[1.02]' : 'hover:scale-[1.01] hover:border-white/20'
      }`}
      style={{
        borderColor: active ? attr.color : 'rgba(255,255,255,0.09)',
        background: `linear-gradient(160deg, ${attr.color}1a, rgba(10,14,26,0.65) 55%)`,
        boxShadow: active ? `0 0 32px ${attr.color}40` : 'none',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" style={{ filter: `drop-shadow(0 0 10px ${attr.color})` }}>
            {attr.icon}
          </span>
          <div>
            <div className="text-lg font-bold text-white">{attr.label}</div>
            <div className="text-xs text-slate-400">{attr.description}</div>
          </div>
        </div>
        <span
          className="font-display rounded-lg border px-2.5 py-1 text-sm font-black"
          style={{ color: attr.color, background: `${attr.color}1a`, borderColor: `${attr.color}55` }}
        >
          Lv.{level}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="font-display text-2xl font-black" style={{ color: attr.color }}>
            {points}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">累计点数</div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>今日 +{today}</div>
          <div className="text-slate-500">下一级 {nextThreshold}</div>
        </div>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${attr.color}, ${attr.color}bb)`,
            boxShadow: `0 0 12px ${attr.color}`,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
        <span>
          本级 {currentThreshold} → {points}
        </span>
        <span>{pct}%</span>
      </div>
    </button>
  );
}
