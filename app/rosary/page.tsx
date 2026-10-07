"use client";

import { useMemo, useState } from "react";
import {
  MYSTERIES,
  todaysMystery,
  buildRosarySteps,
  type MysteryKey,
} from "@/lib/rosary";

export default function RosaryPage() {
  const [mysteryKey, setMysteryKey] = useState<MysteryKey>(
    () => todaysMystery().key,
  );
  const [index, setIndex] = useState(0);

  const mystery = MYSTERIES[mysteryKey];
  const steps = useMemo(() => buildRosarySteps(mystery), [mystery]);
  const step = steps[index];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  function selectMystery(k: MysteryKey) {
    setMysteryKey(k);
    setIndex(0);
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col px-6 py-8">
      {/* 신비 선택 */}
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {Object.values(MYSTERIES).map((m) => (
          <button
            key={m.key}
            onClick={() => selectMystery(m.key)}
            className={`rounded-lg py-2 text-xs font-semibold ${
              m.key === mysteryKey ? "text-white" : "bg-white text-gray-500"
            }`}
            style={
              m.key === mysteryKey
                ? { backgroundColor: m.color }
                : { border: "1px solid var(--primary-soft)" }
            }
          >
            {m.name.replace("의 신비", "")}
          </button>
        ))}
      </div>

      {/* 진행 바 */}
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>{step.decade === 0 ? "도입/마침" : `제${step.decade}단`}</span>
        <span>
          {index + 1} / {steps.length}
        </span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-primary-soft">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, backgroundColor: mystery.color }}
        />
      </div>

      {/* 묵주알 시각화 */}
      <DecadeBeads
        smallIndex={step.bead === "small" ? step.smallIndex ?? 0 : 0}
        color={mystery.color}
        isLarge={step.bead !== "small"}
      />

      {/* 기도문 카드 */}
      <div className="my-6 flex-1 rounded-2xl bg-white p-6 shadow-sm">
        <p
          className="mb-3 text-center text-sm font-bold"
          style={{ color: mystery.color }}
        >
          {step.title}
        </p>
        <p className="text-center text-lg leading-relaxed text-gray-800 whitespace-pre-line">
          {step.text}
        </p>
      </div>

      {/* 이동 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex-1 rounded-xl border border-primary-soft bg-white py-3.5 font-semibold text-gray-600 disabled:opacity-40"
        >
          이전
        </button>
        {index < steps.length - 1 ? (
          <button
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
            className="flex-[2] rounded-xl py-3.5 font-semibold text-white"
            style={{ backgroundColor: mystery.color }}
          >
            다음
          </button>
        ) : (
          <button
            onClick={() => setIndex(0)}
            className="flex-[2] rounded-xl bg-primary py-3.5 font-semibold text-white"
          >
            🙏 기도 마치기 (처음으로)
          </button>
        )}
      </div>
    </div>
  );
}

/** 한 단의 성모송 10번을 점 10개로 표현하고 현재 알을 강조 */
function DecadeBeads({
  smallIndex,
  color,
  isLarge,
}: {
  smallIndex: number;
  color: string;
  isLarge: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {isLarge ? (
        <div
          className="h-5 w-5 rotate-45 rounded-sm"
          style={{ backgroundColor: color }}
        />
      ) : (
        Array.from({ length: 10 }).map((_, i) => {
          const n = i + 1;
          const active = n === smallIndex;
          const done = n < smallIndex;
          return (
            <span
              key={i}
              className="h-3 w-3 rounded-full transition-all"
              style={{
                backgroundColor: active || done ? color : "var(--primary-soft)",
                transform: active ? "scale(1.6)" : "scale(1)",
              }}
            />
          );
        })
      )}
    </div>
  );
}
