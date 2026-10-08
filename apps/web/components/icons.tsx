import type { SVGProps } from 'react';

/** Small stroke icon set (24px grid, 1.75 stroke), drawn for this app. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
);
export const IconStates = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Icon>
);
export const IconPulse = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M2 12h4l3-8 4 16 3-8h6" />
  </Icon>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
export const IconMore = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icon>
);
export const IconHistory = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </Icon>
);
export const IconCompare = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7" />
  </Icon>
);
export const IconStar = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  </Icon>
);
export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);
export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
  </Icon>
);
export const IconInfo = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);
export const IconHelp = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01" />
  </Icon>
);
export const IconData = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <ellipse cx="12" cy="5.5" rx="8" ry="2.5" />
    <path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5" />
  </Icon>
);
/** Polymarket's mark (a trapezoid with a ">" inside), redrawn as a line icon like the rest. */
export const IconPolymarket = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 8 18 4v16L6 16V8Z" />
    <path d="m6 8 12 4-12 4" />
  </Icon>
);
export const IconTv = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
);
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

/** Brand mark: three rising tallies inside a ballot-box outline. */
/**
 * The brand mark: three rising count bars in Brazil's flag colours (green, yellow, blue). Fixed
 * colours, the same in both themes.
 */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect x="4" y="18" width="6" height="10" rx="3" fill="#12A15F" />
      <rect x="13" y="11" width="6" height="17" rx="3" fill="#F6C343" />
      <rect x="22" y="4" width="6" height="24" rx="3" fill="#2563D9" />
    </svg>
  );
}
export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);
export const IconPerson = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);
export const IconFlag = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </Icon>
);
export const IconSeats = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 19a9 9 0 0 1 18 0" />
    <path d="M7.5 19a4.5 4.5 0 0 1 9 0" />
  </Icon>
);
export const IconCourt = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 9h18L12 4 3 9Z" />
    <path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18" />
  </Icon>
);
export const IconTrend = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Icon>
);
