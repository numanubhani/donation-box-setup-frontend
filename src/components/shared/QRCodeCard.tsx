'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { useRef } from 'react';

interface QRCodeCardProps {
  data: string;
  boxName: string;
  boxNumber: number;
  size?: number;
  showDownload?: boolean;
}

export default function QRCodeCard({
  data,
  boxName,
  boxNumber,
  size = 140,
  showDownload = true,
}: QRCodeCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = (size + 60) * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size + 60);
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boxName, size / 2, size + 20);
      ctx.font = '11px DM Sans, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`#${boxNumber}`, size / 2, size + 38);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `QR-${boxNumber}-${boxName.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3">
      <div ref={qrRef} className="bg-white p-3 rounded-xl">
        <QRCodeSVG
          value={data}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#0F172A"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-900 font-sora">{boxName}</p>
        <p className="text-xs text-slate-500">#{boxNumber}</p>
      </div>
      {showDownload && (
        <button
          onClick={handleDownload}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <Download size={14} />
          Download
        </button>
      )}
    </div>
  );
}
