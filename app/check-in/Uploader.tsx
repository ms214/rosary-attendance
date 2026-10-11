"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";
import { uploadAttendance, type UploadResult } from "./actions";

// next.config.ts 의 serverActions.bodySizeLimit(4mb)보다 약간 작게 — 넘으면 서버가 에러 페이지를 띄운다
const MAX_UPLOAD_BYTES = 3.9 * 1024 * 1024;

/** 사진을 줄인 뒤 서버 액션으로 보낸다. */
async function compressAndUpload(
  prev: UploadResult | null,
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const small = await compressImage(file);
    if (small.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: "사진 용량이 너무 커요. 다른 사진으로 시도해 주세요." };
    }
    formData.set("photo", small);
  }
  return uploadAttendance(prev, formData);
}

export default function Uploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    UploadResult | null,
    FormData
  >(compressAndUpload, null);

  useEffect(() => {
    // 업로드 성공 → 서버 상태(출석 완료 화면) 반영을 위해 새로고침
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary-soft bg-white"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="미리보기" className="h-full w-full object-cover" />
        ) : (
          <span className="text-center text-gray-400">
            <span className="mb-2 block text-5xl">📷</span>
            탭하여 사진 촬영 / 선택
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        name="photo"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
      />

      {state && !state.ok && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !preview}
        className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "올리는 중…" : "출석 체크하기"}
      </button>
    </form>
  );
}
