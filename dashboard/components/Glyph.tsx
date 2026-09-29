import type { LucideIcon } from "lucide-react";

const SIZES = { sm: 12, md: 14, lg: 16 } as const;

type GlyphSize = keyof typeof SIZES;

export default function Glyph({
  icon: Icon,
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  size?: GlyphSize;
  className?: string;
}) {
  return (
    <Icon aria-hidden size={SIZES[size]} strokeWidth={1.5} absoluteStrokeWidth className={`shrink-0 ${className}`} />
  );
}
