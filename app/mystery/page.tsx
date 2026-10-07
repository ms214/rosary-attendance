import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { MYSTERIES, todaysMystery } from "@/lib/rosary";

export default async function MysteryPage() {
  await requireProfile();
  const today = todaysMystery();

  return (
    <div className="px-6 py-8">
      <h1 className="mb-1 text-xl font-bold">묵주기도의 신비</h1>
      <p className="mb-6 text-sm text-gray-500">
        오늘은 <b style={{ color: today.color }}>{today.name}</b>를 바치는 날이에요.
      </p>

      <div className="space-y-4">
        {Object.values(MYSTERIES).map((m) => {
          const isToday = m.key === today.key;
          return (
            <section
              key={m.key}
              className={`rounded-2xl border bg-white p-5 ${
                isToday ? "border-2" : "border-primary-soft"
              }`}
              style={isToday ? { borderColor: m.color } : undefined}
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <h2 className="font-bold" style={{ color: m.color }}>
                  {m.name}
                </h2>
                {isToday && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                    오늘
                  </span>
                )}
              </div>
              <ol className="space-y-2 text-sm text-gray-700">
                {m.decades.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-semibold text-gray-400">
                      {i + 1}.
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <Link
        href="/rosary"
        className="mt-6 block rounded-xl bg-primary py-3.5 text-center font-semibold text-white"
      >
        📿 가상 묵주로 기도 시작하기
      </Link>
    </div>
  );
}
