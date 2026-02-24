interface Props {
  size?: number;
  className?: string;
}

/** Векторний логотип PROF1GROUP — три тактичні шеврони з цифрою "1" */
export function P1GIcon({ size = 40, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Шеврон 1 — верхній */}
      <path d="M6 6 H94 V26 L50 46 L6 26 Z" fill="#E31E24" />
      {/* Шеврон 2 — середній */}
      <path d="M6 34 L94 34 L94 54 L50 74 L6 54 Z" fill="#E31E24" />
      {/* Шеврон 3 — нижній */}
      <path d="M6 62 L94 62 L94 82 L50 102 L6 82 Z" fill="#E31E24" />
      {/* Цифра "1" */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="42"
        fill="#111111"
      >
        1
      </text>
    </svg>
  );
}
