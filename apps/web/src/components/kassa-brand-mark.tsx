import type { CSSProperties } from "react";

interface KassaBrandMarkProps {
  variant?: "dark" | "light";
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function KassaBrandMark({
  variant = "dark",
  size = 42,
  className = "cadra-brand__mark",
  style,
}: KassaBrandMarkProps) {
  const src = variant === "light" ? "/branding/kassa-icon-light.svg" : "/branding/kassa-icon-dark.svg";
  return (
    <img
      src={src}
      alt="Kassa"
      width={size}
      height={size}
      className={className}
      style={style}
      draggable={false}
    />
  );
}
