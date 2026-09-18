import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "../cx";

export interface FieldBaseProps {
  label: ReactNode;
  /** Hilfetext zwischen Label und Eingabe. */
  description?: ReactNode;
  /** Fehlertext unter der Eingabe; setzt aria-invalid und aria-describedby. */
  error?: ReactNode;
  required?: boolean;
  requiredLabel?: string;
  optionalLabel?: string;
  /** Beschriftung ausblenden (nur für Screenreader), z. B. in Suchfeldern. */
  hideLabel?: boolean;
  className?: string;
}

interface FieldShellProps extends FieldBaseProps {
  id: string;
  children: (attrs: { id: string; "aria-describedby": string | undefined; "aria-invalid": true | undefined; "aria-required": true | undefined }) => ReactNode;
}

export const controlClassName = cx(
  "w-full min-h-touch rounded-md border border-line bg-surface px-3 text-base text-fg placeholder:text-fg-muted",
  "transition-colors duration-200 motion-reduce:transition-none",
  "hover:border-line-strong focus:border-focus focus:outline-2 focus:outline-offset-1 focus:outline-focus",
  "aria-invalid:border-danger-fill aria-invalid:focus:outline-danger-fill",
  "disabled:bg-muted disabled:text-on-disabled disabled:cursor-not-allowed"
);

/** Layout: Label oben, Beschreibung, Eingabe, Fehlertext unten. */
export function FieldShell({ id, label, description, error, required = false, requiredLabel = "Pflichtfeld", optionalLabel, hideLabel = false, className, children }: FieldShellProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cx("text-sm font-medium text-fg", hideLabel && "sr-only")}>
        {label}
        {required ? <span aria-hidden="true" className="ms-0.5 text-danger-text">*</span> : optionalLabel ? <span className="ms-1 font-normal text-fg-muted">({optionalLabel})</span> : null}
        {required && <span className="sr-only"> ({requiredLabel})</span>}
      </label>
      {description && <p id={descriptionId} className="text-sm text-fg-secondary">{description}</p>}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, "aria-required": required ? true : undefined })}
      <p id={errorId} className={cx("text-sm text-danger-text", !error && "hidden")} aria-live="polite">
        {error}
      </p>
    </div>
  );
}

export type InputProps = FieldBaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "required"> & { id?: string; inputClassName?: string };

export function Input({ id, label, description, error, required, requiredLabel, optionalLabel, hideLabel, className, inputClassName, ...rest }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const shell: FieldBaseProps = { label, ...(description !== undefined && { description }), ...(error !== undefined && { error }), ...(required !== undefined && { required }), ...(requiredLabel !== undefined && { requiredLabel }), ...(optionalLabel !== undefined && { optionalLabel }), ...(hideLabel !== undefined && { hideLabel }), ...(className !== undefined && { className }) };
  return (
    <FieldShell id={fieldId} {...shell}>
      {(attrs) => <input {...attrs} required={required} className={cx(controlClassName, inputClassName)} {...rest} />}
    </FieldShell>
  );
}

export interface SelectOption { value: string; label: string; disabled?: boolean }

export type SelectProps = FieldBaseProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "required"> & { id?: string; options?: SelectOption[]; placeholder?: string; selectClassName?: string };

export function Select({ id, label, description, error, required, requiredLabel, optionalLabel, hideLabel, className, selectClassName, options, placeholder, children, ...rest }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const shell: FieldBaseProps = { label, ...(description !== undefined && { description }), ...(error !== undefined && { error }), ...(required !== undefined && { required }), ...(requiredLabel !== undefined && { requiredLabel }), ...(optionalLabel !== undefined && { optionalLabel }), ...(hideLabel !== undefined && { hideLabel }), ...(className !== undefined && { className }) };
  return (
    <FieldShell id={fieldId} {...shell}>
      {(attrs) => (
        <select {...attrs} required={required} className={cx(controlClassName, "appearance-none bg-[length:1rem] bg-[position:right_0.75rem_center] bg-no-repeat pe-9 rtl:bg-[position:left_0.75rem_center]", selectClassName)} {...rest}>
          {placeholder && <option value="" disabled={required}>{placeholder}</option>}
          {options?.map((opt) => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export type TextareaProps = FieldBaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className" | "required"> & { id?: string; textareaClassName?: string };

export function Textarea({ id, label, description, error, required, requiredLabel, optionalLabel, hideLabel, className, textareaClassName, rows = 4, ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const shell: FieldBaseProps = { label, ...(description !== undefined && { description }), ...(error !== undefined && { error }), ...(required !== undefined && { required }), ...(requiredLabel !== undefined && { requiredLabel }), ...(optionalLabel !== undefined && { optionalLabel }), ...(hideLabel !== undefined && { hideLabel }), ...(className !== undefined && { className }) };
  return (
    <FieldShell id={fieldId} {...shell}>
      {(attrs) => <textarea {...attrs} required={required} rows={rows} className={cx(controlClassName, "py-2 leading-normal", textareaClassName)} {...rest} />}
    </FieldShell>
  );
}

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "className"> & {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  className?: string;
};

/** Checkbox mit Label rechts (logisch: end) und Fehlertext darunter. */
export function Checkbox({ id, label, description, error, className, ...rest }: CheckboxProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <div className="flex min-h-touch items-start gap-3">
        <input
          id={fieldId}
          type="checkbox"
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className="mt-3 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          {...rest}
        />
        <label htmlFor={fieldId} className="flex min-h-touch flex-col justify-center py-2 text-base text-fg">
          <span>{label}</span>
          {description && <span id={descriptionId} className="text-sm text-fg-secondary">{description}</span>}
        </label>
      </div>
      <p id={errorId} className={cx("text-sm text-danger-text", !error && "hidden")} aria-live="polite">{error}</p>
    </div>
  );
}

export interface RadioOption { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }

export interface RadioGroupProps {
  name: string;
  legend: ReactNode;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Optionen nebeneinander statt untereinander. */
  inline?: boolean;
  className?: string;
}

/** Radiogruppe als fieldset mit Legende oben und Fehlertext unten. */
export function RadioGroup({ name, legend, options, value, defaultValue, onChange, description, error, required, disabled, inline = false, className }: RadioGroupProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset className={cx("flex flex-col gap-1.5", className)} aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} aria-invalid={error ? true : undefined} aria-required={required ? true : undefined} disabled={disabled}>
      <legend className="text-sm font-medium text-fg">{legend}{required && <span aria-hidden="true" className="ms-0.5 text-danger-text">*</span>}</legend>
      {description && <p id={descriptionId} className="text-sm text-fg-secondary">{description}</p>}
      <div className={cx("flex gap-2", inline ? "flex-row flex-wrap" : "flex-col")}>
        {options.map((opt) => {
          const optId = `${id}-${opt.value}`;
          return (
            <div key={opt.value} className="flex min-h-touch items-start gap-3">
              <input
                id={optId}
                type="radio"
                name={name}
                value={opt.value}
                checked={value === undefined ? undefined : value === opt.value}
                defaultChecked={value === undefined && defaultValue === opt.value ? true : undefined}
                onChange={() => onChange?.(opt.value)}
                disabled={opt.disabled}
                className="mt-3 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
              <label htmlFor={optId} className="flex min-h-touch flex-col justify-center py-2 text-base text-fg">
                <span>{opt.label}</span>
                {opt.description && <span className="text-sm text-fg-secondary">{opt.description}</span>}
              </label>
            </div>
          );
        })}
      </div>
      <p id={errorId} className={cx("text-sm text-danger-text", !error && "hidden")} aria-live="polite">{error}</p>
    </fieldset>
  );
}
