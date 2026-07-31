import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

function base(children: ReactNode, { size = 20, color = 'currentColor', strokeWidth = 2.75, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

export const IconSettings = (p: IconProps = {}) =>
  base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
    p
  );

export const IconArrowLeft = (p: IconProps = {}) =>
  base(<path d="M19 12H5M12 19l-7-7 7-7" />, p);

export const IconChevronsLeft = (p: IconProps = {}) =>
  base(<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />, p);

export const IconChevronsRight = (p: IconProps = {}) =>
  base(<path d="M13 17l5-5-5-5M6 17l5-5-5-5" />, p);

export const IconPlus = (p: IconProps = {}) => base(<path d="M12 5v14M5 12h14" />, p);

export const IconCheck = (p: IconProps = {}) => base(<path d="M20 6L9 17l-5-5" />, p);

export const IconClock = (p: IconProps = {}) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
    p
  );

export const IconUpload = (p: IconProps = {}) =>
  base(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></>, p);

export const IconFile = (p: IconProps = {}) =>
  base(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15h6" /></>, p);

export const IconMenu = (p: IconProps = {}) => base(<path d="M4 6h16M4 12h16M4 18h10" />, p);

export function IconPlay({ size = 19, color = '#201e1d', style }: IconProps = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}>
      <path d="M7 4l13 8-13 8z" />
    </svg>
  );
}

export function IconPause({ size = 28, color = '#fff', style }: IconProps = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}>
      <rect x="6" y="4" width="4.5" height="16" rx="1.6" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="1.6" />
    </svg>
  );
}
