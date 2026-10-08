'use client';

import type { ResultDTO } from '@eleicoes/election-core';
import { useEffect, useState } from 'react';
import { shareImage, shareText } from '@/lib/share';
import { IconClose } from './icons';

const SITE = 'eleicoes.lucianookdp.dev';
const coarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/**
 * Shares the result shown: on phones the system share sheet (image + text with the link, e.g. to
 * WhatsApp); elsewhere a small panel to copy the text, open WhatsApp or download the image.
 */
export function ShareButton({ result }: { result: ResultDTO }) {
  const [panel, setPanel] = useState<{ text: string; image: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(
    () => () => {
      if (panel?.image) URL.revokeObjectURL(panel.image);
    },
    [panel],
  );

  const share = async () => {
    const text = shareText(result, window.location.href);
    const blob = await shareImage(result, SITE).catch(() => null);
    if (coarse() && navigator.share) {
      try {
        const file = blob ? new File([blob], 'resultado.png', { type: 'image/png' }) : null;
        if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
        else await navigator.share({ text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    setCopied(false);
    setPanel({ text, image: blob ? URL.createObjectURL(blob) : null });
  };

  return (
    <>
      <button
        type="button"
        onClick={share}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-[14px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          width={17}
          height={17}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path
            d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Compartilhar
      </button>
      {panel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Compartilhar resultado"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Fechar"
            onClick={() => setPanel(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line-strong bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Compartilhar resultado</p>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="p-1 text-muted"
                aria-label="Fechar"
              >
                <IconClose />
              </button>
            </div>
            {panel.image && (
              // biome-ignore lint/performance/noImgElement: generated blob preview
              <img
                src={panel.image}
                alt="Imagem do resultado"
                className="mb-3 w-full rounded-lg border border-line"
              />
            )}
            <pre className="mb-3 whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-sans text-[13px] text-ink-2">
              {panel.text}
            </pre>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(panel.text);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="h-10 rounded-lg border border-line text-[14px] font-medium hover:border-line-strong"
              >
                {copied ? 'Texto copiado' : 'Copiar texto'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(panel.text)}`}
                target="_blank"
                rel="noopener"
                className="flex h-10 items-center justify-center rounded-lg border border-line text-[14px] font-medium hover:border-line-strong"
              >
                WhatsApp
              </a>
              {panel.image && (
                <a
                  href={panel.image}
                  download="resultado.png"
                  className="flex h-10 items-center justify-center rounded-lg border border-line text-[14px] font-medium hover:border-line-strong"
                >
                  Baixar imagem
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** "Compartilhar o site": the system sheet where available, otherwise copies the link. */
export async function shareSite(): Promise<'shared' | 'copied' | 'failed'> {
  const url = `https://${SITE}/`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Eleições Brasil',
        text: 'Apuração ao vivo com os dados oficiais do TSE',
        url,
      });
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
    return 'failed';
  }
}
