import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

export function RoundIconButton({ children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        width: 42,
        height: 42,
        flex: '0 0 42px',
        border: 'none',
        borderRadius: 999,
        background: '#ebddc5',
        color: '#201e1d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#e0cdad')}
      onMouseLeave={(e) => (e.currentTarget.style.background = (style?.background as string) || '#ebddc5')}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        border: 'none',
        background: disabled ? '#d7a377' : '#c67139',
        color: '#fff',
        fontFamily: 'Figtree, sans-serif',
        fontSize: 17,
        fontWeight: 700,
        padding: '18px',
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transition: 'background-color .15s ease',
        ...style,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#a8542c')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = '#c67139')}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        border: '1.5px solid rgba(32,30,29,0.16)',
        background: 'none',
        color: '#201e1d',
        fontFamily: 'Figtree, sans-serif',
        fontSize: 16,
        fontWeight: 600,
        padding: 16,
        borderRadius: 999,
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(32,30,29,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        border: 'none',
        background: 'none',
        color: 'rgba(32,30,29,0.5)',
        fontFamily: 'Figtree, sans-serif',
        fontSize: 14.5,
        fontWeight: 600,
        padding: 12,
        borderRadius: 999,
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#a8542c';
        e.currentTarget.style.background = 'rgba(198,113,57,0.09)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(32,30,29,0.5)';
        e.currentTarget.style.background = 'none';
      }}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'rgba(32,30,29,0.5)',
        }}
      >
        {label}
      </span>
      <input
        {...rest}
        style={{
          fontFamily: 'Figtree, sans-serif',
          fontSize: 16,
          color: '#201e1d',
          padding: '16px 20px',
          borderRadius: 999,
          border: '1.5px solid rgba(32,30,29,0.14)',
          background: '#fffaf0',
          outline: 'none',
        }}
      />
    </label>
  );
}

export function ProgressBar({ pct, height = 5 }: { pct: number; height?: number }) {
  return (
    <div style={{ flex: 1, height, borderRadius: 999, background: 'rgba(32,30,29,0.12)', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          borderRadius: 999,
          background: '#c67139',
          width: `${Math.max(0, Math.min(100, pct))}%`,
          transition: 'width .25s ease',
        }}
      />
    </div>
  );
}
