export default function Loading() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
    </div>
  );
}
