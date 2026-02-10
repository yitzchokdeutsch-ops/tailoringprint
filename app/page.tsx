'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    inputRef.current?.focus();

    const keepFocus = () => inputRef.current?.focus();
    window.addEventListener('click', keepFocus);
    document.addEventListener('visibilitychange', keepFocus);

    return () => {
      window.removeEventListener('click', keepFocus);
      document.removeEventListener('visibilitychange', keepFocus);
    };
  }, []);

  async function print(codeRaw: string) {
    const code = codeRaw.trim();

    if (!/^\d{6,8}$/.test(code)) {
      setStatus('Error: Code must be 6–8 digits.');
      return;
    }

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
      setValue('');
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Scan → Print (Big Number)</h1>
        <p style={{ marginTop: 10, opacity: 0.75, fontSize: 16 }}>
          Scan a barcode (6–8 digits). It will print a centered 4×6 label with the number only.
        </p>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            print(value);
          }}
          onBlur={() => inputRef.current?.focus()}
          inputMode="numeric"
          autoComplete="off"
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
          Tip: Most USB scanners act like a keyboard and send Enter after each scan. Click anywhere on the page if the
          input ever loses focus.
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => print(value)}
            style={{
              marginTop: 8,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
