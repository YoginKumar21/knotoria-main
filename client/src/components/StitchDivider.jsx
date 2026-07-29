// The signature motif of Knotoria: a hand-drawn chain-stitch line,
// standing in for plain hairline dividers throughout the site.
export default function StitchDivider({ width = 120, color = "#C2694B", className = "" }) {
  return (
    <span className={`stitch-divider ${className}`} style={{ width }} aria-hidden="true">
      <svg viewBox="0 0 120 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 7c4-5 8-5 12 0s8 5 12 0 8-5 12 0 8 5 12 0 8-5 12 0 8 5 12 0 8-5 12 0 8 5 12 0 8-5 12 0"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
