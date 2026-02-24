interface Props {
  size?: number;
  className?: string;
}

/**
 * Логотип PROF1GROUP — три V-шеврони вниз + біла "1"
 * Кожен шеврон = зовнішній трикутник мінус внутрішній (fillRule evenodd)
 */
export function P1GIcon({ size = 40, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Три червоних шеврони: зовнішній V − внутрішній V = смуга */}
      <path
        fillRule="evenodd"
        fill="#E31E24"
        d="
          M 2  4  H 98 L 50 28 Z   M 15  4  H 85 L 50 17 Z
          M 2 36  H 98 L 50 60 Z   M 15 36  H 85 L 50 49 Z
          M 2 68  H 98 L 50 92 Z   M 15 68  H 85 L 50 81 Z
        "
      />

      {/* Біла "1" поверх */}
      <text
        x="50"
        y="47"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="44"
        fill="white"
      >
        1
      </text>
    </svg>
  );
}
