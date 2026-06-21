import { toSvgString } from "@goker/qr-code";

export function ProfileQrCard({ token }: { token: string }) {
  const url = `https://darkgammon.com/ni/!${token}`;

  const svgString = toSvgString(url, {
    ecc: "M",
    render: { moduleSize: 6, margin: 4 },
  });

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-2xl w-fit mx-auto">
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: svg
        dangerouslySetInnerHTML={{ __html: svgString }}
        className="w-48 h-48 sm:w-64 sm:h-64 flex justify-center items-center [&>svg]:w-full [&>svg]:h-full"
      />
      <p className="text-black font-semibold text-center mt-2">
        Scan to challenge me
      </p>
    </div>
  );
}
