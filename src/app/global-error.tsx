"use client";

export default function GlobalError({
  // biome-ignore lint/correctness/noUnusedFunctionParameters: Required by Next.js
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body>
        <h2>Something went wrong globally!</h2>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
