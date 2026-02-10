'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  // Allow: letters, numbers, space, dash, comma, dot, slash
  // Length: 6–20 characters
  const ALLOWED_RE = /^[A-Za-z0-9,\- .\/]{6,20}$/;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function normalize(raw: string) {
    // Strip scanner CR/LF, collapse weird whitespace, trim ends
    return raw.replace(/[\r\n]+/g, '').replace(/\s+/g, ' ').trim();
  }

  async function doPrint(input: string) {
    if (isPrinting) return;

    const clean = normalize(input);

    if (!ALLOWED_RE.test(clean)) {
      setStatus('Error: Use 6–20 chars. Allowed: letters/numbers, space, -, comma, ., /');
      return;
    }

    setIsPrinting(true);
    setStatus('Printing…');

    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Print failed (${res.status})`);

      setStatus(`Printed: ${clean}`);
      setValue('');
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsPrinting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        fontFamily: 'system-ui',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h1 style={{ fontSize: 32, margin: 0 }}>Scan → Print (Big Code)</h1>
        <p style={{ marginTop: 8, marginBottom: 18, opacity: 0.75 }}>
          Enter/scan a code (6–20 chars). Allowed: letters/numbers, space, -, comma, ., /
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            doPrint(value);
          }}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Scan here…"
            style={{
              width: '100%',
              fontSize: 44,
              padding: '16px 16px',
              borderRadius: 14,
              border: '2px solid #ccc',
              outline: 'none',
              letterSpacing: 1,
            }}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <button
              type="submit"
              disabled={isPrinting}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 14,
                border: '1px solid #111',
                background: isPrinting ? '#ddd' : '#111',
                color: '#fff',
                fontSize: 18,
                fontWeight: 600,
                cursor: isPrinting ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation',
              }}
            >
              {isPrinting ? 'Printing…' : 'Print'}
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('');
                setStatus('');
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              style={{
                width: 140,
                height: 56,
                borderRadius: 14,
                border: '1px solid #ccc',
                background: '#fff',
                fontSize: 16,
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              Clear
            </button>
          </div>
        </form>

        <div style={{ marginTop: 14, fontSize: 18 }}>{status}</div>

        <div style={{ marginTop: 14, opacity: 0.65, fontSize: 14, lineHeight: 1.4 }}>
          Tip: scanners often add an Enter—this form works with Enter or the Print button.
        </div>
      </div>
    </div>
  );
}
