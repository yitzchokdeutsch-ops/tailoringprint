'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Focus once on load. No global click handlers.
    inputRef.current?.focus();
  }, []);

  function normalize(raw: string) {
    // Keep digits only (handles scanners that add CR/LF)
    return raw.replace(/[^\d]/g, '');
  }

  async function doPrint(code: string) {
    if (isPrinting) return;

    const clean = normalize(code);

    if (!/^\d{6,10}$/.test(clean)) {
      setStatus('Error: Code must be 6–8 digits.');
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
      // Refocus after everything settles so it doesn't block clicks
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
      <div style={{ width: '100%', maxWidth: 720, background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 20 }}>
        <h1 style={{ fontSize: 32, margin: 0 }}>Scan → Print (Big Number)</h1>
        <p style={{ marginTop: 8, marginBottom: 18, opacity: 0.75 }}>
          Enter/scan 6–8 digits. Press Enter or tap Print.
        </p>

        {/* Form submit makes the button click 100% reliable across browsers */}
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
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Scan here…"
            style={{
              width: '100%',
              fontSize: 56,
              padding: '16px 16px',
              borderRadius: 14,
              border: '2px solid #ccc',
              outline: 'none',
              letterSpacing: 2,
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
                touchAction: 'manipulation', // improves tap reliability on iOS
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
          Tip: If you’re using an iPad, tap into the input once, then scanning will keep filling it.
        </div>
      </div>
    </div>
  );
}
