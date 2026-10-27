// Small inline SVG icon set (no icon library needed). Stroke icons on a 24px grid.
const PATHS = {
  week: 'M4 7h16M4 12h16M4 17h10',
  plan: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 5l-7 7 7 7',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  dumbbell: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
}

export default function Icon({ name, size = 24, strokeWidth = 2, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
