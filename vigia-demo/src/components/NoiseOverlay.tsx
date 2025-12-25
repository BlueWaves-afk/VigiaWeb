"use client";

export default function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 z-[999] pointer-events-none"
      style={{
        backgroundImage: "url('/noise.png')",
        backgroundRepeat: "repeat",
        opacity: 0.15,
      }}
    />
  );
}
