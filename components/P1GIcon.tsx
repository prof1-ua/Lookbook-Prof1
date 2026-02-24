import Image from "next/image";

interface Props {
  size?: number;
  className?: string;
}

export function P1GIcon({ size = 40, className = "" }: Props) {
  return (
    <Image
      src="/logo.png"
      width={size}
      height={size}
      alt="PROF1GROUP"
      className={className}
      unoptimized
    />
  );
}
