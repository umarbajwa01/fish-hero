const stars = [
  [20.6, 12.4, 22, 0.42],
  [29.5, 22.8, 13, 0.88],
  [83.4, 76.4, 23, 0.48],
  [9.1, 61.2, 4, 0.42],
  [60.1, 26.2, 6, 0.68],
  [77.2, 35.8, 4, 0.56],
  [15.4, 47.6, 4, 0.48],
  [62.9, 62.8, 4, 0.45],
  [87.8, 42.7, 3, 0.4],
  [30.2, 68.7, 7, 0.32],
  [43.6, 18.8, 3, 0.3],
  [70.1, 82.4, 3, 0.38],
  [10.1, 28.9, 3, 0.32],
  [53.4, 88.1, 3, 0.36],
  [39.6, 81.2, 4, 0.24],
];
export default function Constellation() {
  return (
    <div className="constellation" aria-hidden="true">
      <div className="constellation-field">
        {stars.map(([x, y, size, opacity], i) => (
          <span
            key={i}
            className={size > 6 ? "star" : "speck"}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              "--star-rest": opacity,
              "--star-peak": size > 6 ? 0.94 : Math.min(0.85, opacity + 0.25),
              "--twinkle-duration": `${(size > 6 ? 2.4 : 3.6) + (i % 6) * 0.37}s`,
              "--twinkle-delay": `${-0.65 - i * 0.83}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
