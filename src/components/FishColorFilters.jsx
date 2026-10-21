export default function FishColorFilters() {
  return (
    <svg
      className="fish-color-filters"
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Each RGB row sums to one, preserving white highlights and shading. */}
        <filter id="koi-golden" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.94 0.06 0 0 0  0.64 0.36 0 0 0  0.08 0.02 0.9 0 0  0 0 0 1 0"
          />
        </filter>
        <filter id="koi-orange" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0.34 0.66 0 0 0  0.025 0 0.975 0 0  0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
