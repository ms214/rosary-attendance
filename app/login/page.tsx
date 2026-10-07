"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syntheticEmail, pinToPassword } from "@/lib/synthetic";

type Student = { name: string; baptismal_name: string };

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .rpc("list_students")
      .then(({ data }) => setStudents((data as Student[]) ?? []));
  }, [supabase]);

  const filtered = students.filter(
    (s) =>
      s.name.includes(query) || s.baptismal_name.includes(query),
  );

  async function submit() {
    if (!selected || pin.length !== 4) return;
    setLoading(true);
    setError(null);
    const email = await syntheticEmail(selected.name, selected.baptismal_name);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pinToPassword(pin),
    });
    if (error) {
      setLoading(false);
      setPin("");
      setError("PIN이 올바르지 않아요. 다시 입력해 주세요.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  // ── PIN 입력 화면 ──
  if (selected) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8">
        <button
          onClick={() => {
            setSelected(null);
            setPin("");
            setError(null);
          }}
          className="self-start text-sm text-gray-400"
        >
          ← 이름 다시 선택
        </button>
        <div className="text-center">
          <div className="text-5xl">📿</div>
          <p className="mt-3 text-lg font-bold">
            {selected.baptismal_name} {selected.name}
          </p>
          <p className="text-sm text-gray-500">PIN 4자리를 입력하세요</p>
        </div>

        <input
          autoFocus
          inputMode="numeric"
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="input w-40 text-center text-3xl tracking-[0.5em]"
          placeholder="••••"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={pin.length !== 4 || loading}
          className="w-full max-w-xs rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "확인 중…" : "로그인"}
        </button>
      </div>
    );
  }

  // ── 이름 선택 화면 ──
  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <div className="mb-6 text-center">
        <div className="text-5xl">📿</div>
        <h1 className="mt-2 text-xl font-bold text-primary">묵주기도 성월</h1>
        <p className="text-sm text-gray-500">명단에서 내 이름을 찾아 선택하세요</p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input mb-4"
        placeholder="이름 또는 세례명 검색"
      />

      <div className="flex-1 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            아직 등록된 학생이 없어요.
          </p>
        ) : (
          filtered.map((s) => (
            <button
              key={`${s.name}-${s.baptismal_name}`}
              onClick={() => setSelected(s)}
              className="w-full rounded-xl border border-primary-soft bg-white px-4 py-3.5 text-left font-medium"
            >
              <span className="text-primary">{s.baptismal_name}</span> {s.name}
            </button>
          ))
        )}
      </div>

      <Link
        href="/signup"
        className="mt-4 block rounded-xl bg-primary py-3.5 text-center font-semibold text-white"
      >
        처음이에요? 가입하기
      </Link>
    </div>
  );
}
