import type { CSSProperties } from "react";

interface TumpuBrandMarkProps {
  variant?: "dark" | "light";
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function TumpuBrandMark({
  variant = "dark",
  size = 42,
  className = "cadra-brand__mark",
  style,
}: TumpuBrandMarkProps) {
  const src = variant === "light" ? "/branding/tumpu-icon-light.svg" : "/branding/tumpu-icon-dark.svg";
  return (
    <img
      src={src}
      alt="Tumpu"
      width={size}
      height={size}
      className={className}
      style={style}
      draggable={false}
    />
  );
}
