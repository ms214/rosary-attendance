"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syntheticEmail, pinToPassword } from "@/lib/synthetic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [baptismal, setBaptismal] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !baptismal.trim() || pin.length !== 4) {
      return setError("이름·세례명·PIN 4자리를 모두 입력해 주세요.");
    }

    setLoading(true);
    const email = await syntheticEmail(name, baptismal);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pinToPassword(pin),
    });
    if (error) {
      setLoading(false);
      setPin("");
      return setError("이름·세례명·PIN 중 하나가 올바르지 않아요.");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="text-5xl">📿</div>
        <h1 className="mt-2 text-xl font-bold text-primary">묵주기도 성월</h1>
        <p className="text-sm text-gray-500">이름·세례명·PIN으로 로그인하세요</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="이름 (예: 홍길동)"
          autoComplete="off"
        />
        <input
          value={baptismal}
          onChange={(e) => setBaptismal(e.target.value)}
          className="input"
          placeholder="세례명 (예: 베드로)"
          autoComplete="off"
        />
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(null);
          }}
          inputMode="numeric"
          type="password"
          maxLength={4}
          className="input tracking-[0.4em]"
          placeholder="PIN 4자리"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "확인 중…" : "로그인"}
        </button>
      </form>

      <Link
        href="/signup"
        className="mt-5 block text-center text-sm text-primary underline"
      >
        처음이에요? 가입하기
      </Link>
    </div>
  );
}
