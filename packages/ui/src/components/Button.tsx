import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { IconSpinner } from "./icons";
import { VisuallyHidden } from "./VisuallyHidden";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Zeigt einen Spinner, blockiert Klicks und setzt aria-busy. */
  loading?: boolean;
  /** Screenreader-Text während des Ladens. */
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export type ButtonAsButtonProps = ButtonBaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & { href?: undefined };
export type ButtonAsLinkProps = ButtonBaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & { href: string };
export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active shadow-sm",
  secondary: "bg-secondary text-primary hover:bg-secondary-hover border border-line",
  ghost: "bg-transparent text-primary hover:bg-secondary",
  danger: "bg-danger text-on-primary hover:bg-danger-hover shadow-sm"
};

/** sm ist nur für dichte Desktop-Tabellen gedacht; md und lg erreichen das Touch-Ziel von 44 px. */
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm gap-1.5",
  md: "min-h-touch px-4 text-base gap-2",
  lg: "min-h-12 px-6 text-lg gap-2"
};

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", fullWidth = false, className?: string): string {
  return cx(
    "inline-flex items-center justify-center rounded-md font-medium leading-none select-none",
    "transition-colors duration-200 ease-standard motion-reduce:transition-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:bg-disabled disabled:text-on-disabled disabled:shadow-none disabled:cursor-not-allowed aria-disabled:bg-disabled aria-disabled:text-on-disabled aria-disabled:pointer-events-none",
    VARIANT[variant],
    SIZE[size],
    fullWidth && "w-full",
    className
  );
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", loading = false, loadingLabel = "Wird geladen", leadingIcon, trailingIcon, fullWidth = false, className, children, ...rest } = props;
  const content = (
    <>
      {loading ? <IconSpinner size={size === "sm" ? 16 : 20} /> : leadingIcon}
      <span>{children}</span>
      {loading ? <VisuallyHidden aria-live="polite">{loadingLabel}</VisuallyHidden> : trailingIcon}
    </>
  );
  const classes = buttonClassName(variant, size, fullWidth, className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...anchor } = rest as Omit<ButtonAsLinkProps, keyof ButtonBaseProps>;
    return (
      <a href={loading ? undefined : href} role={loading ? "link" : undefined} aria-disabled={loading || undefined} aria-busy={loading || undefined} className={classes} {...anchor}>
        {content}
      </a>
    );
  }
  const { type = "button", disabled, ...button } = rest as Omit<ButtonAsButtonProps, keyof ButtonBaseProps>;
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...button}>
      {content}
    </button>
  );
}
