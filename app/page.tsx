'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  // Keep the scanner input focused, but DON'T use a global window click handler
  // (it can interfere with button clicks on some browsers/iPad).
  useEffect(() => {
    inputRef.current?.focus();

    const refocus = () => {
      // tiny delay helps on mobile Safari / iPad
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    document.addEventListener('visibilitychange', refocus);
    return () => document.removeEventListener('visibilitychange', refocus);
  }, []);

  function normalizeDigits(raw: string) {
    // some scanners append \r or \n; keep digits only
    return raw.replace(/[^\d]/g, '').trim();
  }

  async function print(codeRaw: string) {
    if (isPrinting) return;

    const code = normalizeDigits(codeRaw);

    if (!/^\d{6,8}$/.test(code)) {
      setStatus('Error: Code must be 6–8 digits.');
      // refocus for next scan
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    setIsPrinting(true);
    setStatus('Printing…');

    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Print failed (${res.status})`);

      setStatus(`Printed: ${code}`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsPrinting(false);
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
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
      }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Scan → Print (Big Number)</h1>
        <p style={{ marginTop: 10, opacity: 0.75, fontSize: 16 }}>
          Scan a barcode (6–8 digits). Prints a centered 4×6 label with the number only.
        </p>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            // Prevent form/submit behavior and keep it consistent
            e.preventDefault();
            const current = value;
            print(current);
          }}
          onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Scan here…"
          style={{
            width: '100%',
            fontSize: 56,
            padding: '18px 18px',
            borderRadius: 14,
            border: '2px solid #ccc',
            outline: 'none',
            letterSpacing: 2,
          }}
        />

        <div style={{ marginTop: 14, fontSize: 18 }}>{status}</div>

        <div style={{ marginTop: 18, opacity: 0.7, fontSize: 14, lineHeight: 1.4 }}>
          Tip: Most USB scanners act like a keyboard and send Enter after each scan.
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            disabled={isPrinting}
            onMouseDown={(e) => e.preventDefault()} // prevents focus-stealing quirks
            onClick={() => print(value)}
            style={{
              marginTop: 8,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #ccc',
              background: isPrinting ? '#f3f3f3' : '#fff',
              cursor: isPrinting ? 'not-allowed' : 'pointer',
              fontSize: 16,
              opacity: isPrinting ? 0.7 : 1,
            }}
          >
            {isPrinting ? 'Printing…' : 'Print'}
          </button>
        </div>
      </div>
    </div>
  );
}
