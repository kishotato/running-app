// Small inline SVG icon set (no icon library needed). Stroke icons on a 24px grid.
const PATHS = {
  // A running person: head, torso, two arms, two legs.
  week: 'M15 2.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM13.5 8 11 13.5M13.5 8l3 3 2.5-.5M13.5 8 10 9.5 8 12.5M11 13.5l3.5 2-1 4.5M11 13.5 8 17l-3.5.5',
  run: 'M15 2.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM13.5 8 11 13.5M13.5 8l3 3 2.5-.5M13.5 8 10 9.5 8 12.5M11 13.5l3.5 2-1 4.5M11 13.5 8 17l-3.5.5',
  bed: 'M3 19V6M3 15h18v4M21 15v-2.5a2.5 2.5 0 0 0-2.5-2.5H11v5M7 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01',
  close: 'M6 6l12 12M18 6 6 18',
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
