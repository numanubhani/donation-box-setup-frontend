'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Box } from '@/types';

const QRS_PER_PAGE = 12;

interface QRPrintSheetProps {
  boxes: Box[];
  /** When true, content is visible on screen (modal preview). When false, hidden until print. */
  preview?: boolean;
}

function chunkBoxes<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

export default function QRPrintSheet({ boxes, preview = false }: QRPrintSheetProps) {
  const activeBoxes = boxes.filter((b) => b.status === 'active');
  const pages = chunkBoxes(activeBoxes, QRS_PER_PAGE);

  if (pages.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">No active boxes with QR codes.</p>
    );
  }

  return (
    <div className={preview ? 'qr-print-preview' : 'hidden print:block print-report qr-print-sheet'}>
      {pages.map((pageBoxes, pageIndex) => (
        <div key={pageIndex} className="qr-print-page">
          <div className="qr-print-header">
            <p className="qr-print-title">Al-Najaat Social Care Foundation</p>
            <p className="qr-print-subtitle">Donation Box QR Codes — Page {pageIndex + 1} of {pages.length}</p>
          </div>
          <div className="qr-print-grid">
            {pageBoxes.map((box) => (
              <div key={box.id} className="qr-print-item">
                <QRCodeSVG
                  value={box.qrCodeData}
                  size={preview ? 90 : 120}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                />
                <p className="qr-print-box-name">{box.name}</p>
                <p className="qr-print-box-meta">#{box.boxNumber} · {box.donorName}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
