import Image from "next/image";

type Props = {
  size?: number;       // rendered height (px)
  className?: string;
  title?: string;      // optional accessible title
};

/** Renders the single VIGIA SVG at a chosen height. */
export default function Logo({ size = 24, className = "", title = "VIGIA" }: Props) {
  // width is approximate; Next/Image needs width+height even for SVG
  const width = Math.round(size * 4); // adjust if your wordmark is wider/narrower
  return (
    <Image
      src="/brand/vigia-logo.svg"
      alt={title}
      width={width}
      height={size}
      className={className}
      priority
    />
  );
}