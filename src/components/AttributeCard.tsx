import type { AttributeDef } from '../lib/attributes';
import { getLevelInfo } from '../lib/levels';

interface AttributeCardProps {
  attr: AttributeDef;
  points: number;
  yesterday: number;
  active: boolean;
  onClick: () => void;
}

export default function AttributeCard({ attr, points, yesterday, active, onClick }: AttributeCardProps) {
  const { level, currentThreshold, nextThreshold, progress } = getLevelInfo(points);
  const pct = Math.round(progress * 100);
  const barWidth = pct === 0 ? 0 : Math.max(pct, 2);
  const gainedInLevel = points - currentThreshold; // 本级内已获得
  const levelSpan = nextThreshold - currentThreshold; // 本级跨度
  const toNextLevel = nextThreshold - points; // 距下一级还差

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-6 text-left transition-all duration-300 ${
        active
          ? 'border-neutral-300'
          : 'border-neutral-200 shadow-sm hover:border-neutral-300 hover:shadow-md'
      }`}
      style={{
        boxShadow: active ? `0 10px 30px ${attr.color}26` : undefined,
        background: active ? `linear-gradient(180deg, ${attr.color}0d, #ffffff 60%)` : undefined,
      }}
    >
      {/* ===== 属性头部 ===== */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ background: `${attr.color}1a` }}
          >
            {attr.icon}
          </span>
          <div>
            <div className="text-base font-bold text-neutral-900">{attr.label}</div>
            <div className="text-xs text-neutral-400">{attr.description}</div>
          </div>
        </div>
        <span className="text-sm font-semibold tabular-nums" style={{ color: attr.color }}>
          Lv.{level}
        </span>
      </div>

      {/* ===== 点数 ===== */}
      <div className="mt-7 flex items-end justify-between gap-4">
        <div>
          <div
            className="text-4xl font-light leading-none tabular-nums sm:text-5xl"
            style={{ color: attr.color }}
          >
            {points}
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-neutral-400">累计点数</div>
        </div>
        <div className="text-right text-xs">
          <div className="font-semibold tabular-nums" style={{ color: attr.color }}>
            昨日 +{yesterday}
          </div>
          <div className="mt-1 text-neutral-400">下一级 {nextThreshold}</div>
        </div>
      </div>

      {/* ===== 进度条 ===== */}
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%`, background: attr.color }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-[11px] tabular-nums text-neutral-400">
        <span>
          当前 {gainedInLevel}/{levelSpan}
        </span>
        <span>{pct}%</span>
      </div>
    </button>
  );
}
