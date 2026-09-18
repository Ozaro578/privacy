import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function base(size: number, props: Omit<IconProps, "size">): SVGProps<SVGSVGElement> {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false, ...props };
}

export function IconCheck({ size = 20, ...props }: IconProps) {
  return <svg {...base(size, props)}><path d="M5 12.5l4.5 4.5L19 7" /></svg>;
}
export function IconCross({ size = 20, ...props }: IconProps) {
  return <svg {...base(size, props)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
}
export function IconInfo({ size = 20, ...props }: IconProps) {
  return <svg {...base(size, props)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
}
export function IconWarning({ size = 20, ...props }: IconProps) {
  return <svg {...base(size, props)}><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4M12 17h.01" /></svg>;
}
export function IconArrowUp({ size = 20, ...props }: IconProps) {
  return <svg {...base(size, props)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
}
export function IconTarget({ size = 20, ...props }: IconProps) {
  return <svg {...base(size, props)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>;
}
export function IconStar({ size = 24, filled = false, ...props }: IconProps & { filled?: boolean }) {
  return <svg {...base(size, props)} fill={filled ? "currentColor" : "none"}><path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.5l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>;
}
export function IconSpinner({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} className={["animate-spin motion-reduce:animate-none", props.className].filter(Boolean).join(" ")}>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
