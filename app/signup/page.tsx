"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syntheticEmail, pinToPassword } from "@/lib/synthetic";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [baptismal, setBaptismal] = useState("");
  const [age, setAge] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !baptismal.trim() || !age) {
      return setError("모든 항목을 입력해 주세요.");
    }
    if (pin.length !== 4) return setError("PIN은 숫자 4자리여야 해요.");
    if (pin !== pin2) return setError("PIN이 서로 달라요. 다시 확인해 주세요.");

    setLoading(true);
    const email = await syntheticEmail(name, baptismal);
    const password = pinToPassword(pin);

    // 1) 계정 생성 시도. "이미 등록됨"은 무시하고 로그인으로 복구한다
    //    (프로필만 비어 있는 고아 계정도 여기서 정상화된다).
    const { error: signErr } = await supabase.auth.signUp({ email, password });
    const alreadyExists = signErr?.message
      .toLowerCase()
      .includes("registered");
    if (signErr && !alreadyExists) {
      setLoading(false);
      return setError("가입에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }

    // 2) 어느 경우든 로그인으로 세션을 확보한다.
    const { error: inErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (inErr) {
      setLoading(false);
      return setError(
        alreadyExists
          ? "같은 이름+세례명이 이미 등록돼 있고 PIN이 달라요. 로그인하거나 교사 선생님께 문의해 주세요."
          : "자동 로그인에 실패했어요. 로그인 화면에서 다시 시도해 주세요.",
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: profErr } = await supabase.from("profiles").upsert({
      id: user!.id,
      name: name.trim(),
      baptismal_name: baptismal.trim(),
      age: Number(age),
    });
    if (profErr) {
      setLoading(false);
      return setError("프로필 저장에 실패했어요. 다시 시도해 주세요.");
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="px-6 py-10">
      <h1 className="mb-1 text-xl font-bold text-primary">가입하기</h1>
      <p className="mb-8 text-sm text-gray-500">
        한 번만 등록하면 다음부터는 이름 선택 + PIN으로 로그인돼요.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <Field label="이름">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="홍길동" />
        </Field>
        <Field label="세례명">
          <input value={baptismal} onChange={(e) => setBaptismal(e.target.value)} className="input" placeholder="베드로" />
        </Field>
        <Field label="나이">
          <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="input" placeholder="16" />
        </Field>
        <Field label="PIN (숫자 4자리)">
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" type="password" maxLength={4} className="input tracking-[0.3em]" placeholder="••••" />
        </Field>
        <Field label="PIN 확인">
          <input value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" type="password" maxLength={4} className="input tracking-[0.3em]" placeholder="••••" />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-50">
          {loading ? "가입 중…" : "가입하고 시작하기"}
        </button>
      </form>

      <Link href="/login" className="mt-5 block text-center text-sm text-primary underline">
        이미 가입했어요 → 로그인
      </Link>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
