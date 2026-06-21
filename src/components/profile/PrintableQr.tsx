"use client";

import { toSvgString } from "@goker/qr-code";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function PrintableQr({
  token,
  handle,
}: {
  token: string;
  handle: string;
}) {
  const [svgHtml, setSvgHtml] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = `https://darkgammon.com/ni/!${token}`;
    const rawQrSvg = toSvgString(url, {
      ecc: "M",
      render: { moduleSize: 8, margin: 2 },
    });

    // We will extract the paths/rects from the generated SVG and wrap them in a printable layout
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawQrSvg, "image/svg+xml");
    const qrPaths = doc.querySelector("svg")?.innerHTML || "";

    const compositeSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
        <rect width="400" height="500" fill="#ffffff" rx="20" />
        
        <!-- Logo / Title -->
        <text x="200" y="60" font-family="sans-serif" font-size="32" font-weight="900" fill="#000000" text-anchor="middle">
          Darkgammon ⚔️
        </text>
        <text x="200" y="90" font-family="sans-serif" font-size="16" font-weight="600" fill="#666666" text-anchor="middle">
          I challenge you to a battle!
        </text>

        <!-- QR Code Container -->
        <g transform="translate(50, 120)">
          ${qrPaths}
        </g>

        <!-- Footer / Address -->
        <text x="200" y="440" font-family="sans-serif" font-size="20" font-weight="bold" fill="#000000" text-anchor="middle">
          @${handle}
        </text>
        <text x="200" y="465" font-family="sans-serif" font-size="14" font-weight="normal" fill="#666666" text-anchor="middle">
          ${url}
        </text>
      </svg>
    `;

    setSvgHtml(compositeSvg);
  }, [token, handle]);

  const handleDownload = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `darkgammon-qr-${handle}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={containerRef}
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-white/20"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: svg
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />

      <Button
        onClick={handleDownload}
        size="lg"
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg"
      >
        Download as SVG (For Printing)
      </Button>
    </div>
  );
}
