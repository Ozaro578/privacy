import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { CalendarMonthGrid, CalendarTimeGrid, getMonthGridDays, getWeekDays, timeToOffset } from "./CalendarGrid";
import { Dialog } from "./Dialog";
import { Checkbox, Input, RadioGroup, Select, Textarea } from "./Field";
import { BottomTabBar, SidebarNav } from "./Navigation";
import { ProgressBar } from "./ProgressBar";
import { ProgressRing } from "./ProgressRing";
import { ReadinessGauge } from "./ReadinessGauge";
import { StarRating } from "./StarRating";
import { Tabs } from "./Tabs";
import { ToastRegion } from "./ToastRegion";
import { VisuallyHidden } from "./VisuallyHidden";

afterEach(cleanup);

describe("Button", () => {
  it("rendert als button mit type=button und reagiert auf Klick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Speichern</Button>);
    const button = screen.getByRole("button", { name: "Speichern" });
    expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("rendert als Link, wenn href gesetzt ist", () => {
    render(<Button href="/lernen" variant="secondary">Lernen</Button>);
    const link = screen.getByRole("link", { name: "Lernen" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/lernen");
  });

  it("blockiert im Ladezustand und meldet aria-busy", () => {
    const onClick = vi.fn();
    render(<Button loading loadingLabel="Wird gespeichert" onClick={onClick}>Speichern</Button>);
    const button = screen.getByRole("button", { name: /Speichern/ });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Wird gespeichert").className).toContain("sr-only");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("nutzt Varianten- und Größenklassen", () => {
    render(<Button variant="danger" size="lg">Löschen</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("bg-danger");
    expect(cls).toContain("min-h-12");
  });
});

describe("Dialog", () => {
  function Harness() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Öffnen</button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Termin stornieren" description="Kostenlos bis morgen" footer={<button type="button" onClick={() => setOpen(false)}>Bestätigen</button>}>
          <input aria-label="Grund" />
        </Dialog>
      </>
    );
  }

  it("ist per Titel beschriftet und schließt mit Escape", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog.getAttribute("aria-labelledby")).toBe(screen.getByText("Termin stornieren").id);
    expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("Kostenlos bis morgen").id);
    expect(dialog.hasAttribute("open")).toBe(true);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog.hasAttribute("open")).toBe(false);
  });

  it("hält den Fokus im Dialog (Tab-Zyklus)", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    const input = screen.getByLabelText("Grund");
    expect(document.activeElement).toBe(input);
    const confirm = screen.getByText("Bestätigen");
    confirm.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByLabelText("Dialog schließen"));
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it("schließt über den Schließen-Button und ruft onClose auf", () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="Hinweis">Text</Dialog>);
    fireEvent.click(screen.getByLabelText("Dialog schließen"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Tabs", () => {
  const items = [
    { id: "a", label: "Anstehend", panel: <p>Panel A</p> },
    { id: "b", label: "Vergangen", panel: <p>Panel B</p> },
    { id: "c", label: "Gesperrt", panel: <p>Panel C</p>, disabled: true }
  ];

  it("setzt ARIA-Attribute und wechselt per Klick", () => {
    render(<Tabs items={items} label="Fahrstunden" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[0]?.getAttribute("aria-controls")).toBe(screen.getByRole("tabpanel").id);
    expect(screen.getByText("Panel A")).toBeTruthy();
    fireEvent.click(tabs[1] as HTMLElement);
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Panel B")).toBeTruthy();
    expect(screen.queryByText("Panel A")).toBeNull();
  });

  it("navigiert mit Pfeiltasten und überspringt deaktivierte Tabs", () => {
    const onChange = vi.fn();
    render(<Tabs items={items} label="Fahrstunden" onChange={onChange} />);
    const list = screen.getByRole("tablist");
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("b");
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("a");
    fireEvent.keyDown(list, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("b");
    expect(document.activeElement?.getAttribute("data-tab-id")).toBe("b");
  });
});

describe("StarRating", () => {
  it("rendert Radios mit Beschriftung und wählt per Klick", () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} label="Spurhalten bewerten" />);
    const group = screen.getByRole("radiogroup", { name: "Spurhalten bewerten" });
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[1]?.getAttribute("tabindex")).toBe("0");
    expect(radios[0]?.getAttribute("tabindex")).toBe("-1");
    fireEvent.click(radios[4] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(5);
    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(1);
    fireEvent.keyDown(group, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("ist im Lesemodus ein Bild mit Beschreibung", () => {
    render(<StarRating value={4} readOnly label="Bewertung" />);
    expect(screen.getByRole("img", { name: "Bewertung: 4 von 5 Sternen" })).toBeTruthy();
  });
});

describe("ReadinessGauge", () => {
  it("zeigt Score, Band und Pflicht-Disclaimer", () => {
    render(<ReadinessGauge score={72} disclaimer="Keine Garantie für das Bestehen." />);
    expect(screen.getByRole("group", { name: "Prüfungsreife 72 von 100, Stufe: Fast bereit" })).toBeTruthy();
    const ring = screen.getByRole("progressbar");
    expect(ring.getAttribute("aria-valuenow")).toBe("72");
    expect(ring.getAttribute("aria-valuetext")).toBe("72 von 100");
    expect(screen.getByText("Fast bereit").getAttribute("data-band")).toBe("yellow_green");
    expect(screen.getByTestId("readiness-disclaimer").textContent).toContain("Keine Garantie");
  });

  it("nutzt übergebene Labels und Band", () => {
    render(<ReadinessGauge score={20} band="green" labels={{ red: "r", orange: "o", yellow_green: "y", green: "Sehr gut" }} disclaimer="D" />);
    expect(screen.getByText("Sehr gut").getAttribute("data-band")).toBe("green");
  });
});

describe("Formularfelder", () => {
  it("Input verknüpft Label, Beschreibung und Fehler", () => {
    render(<Input label="E-Mail-Adresse" description="Dienstlich oder privat" error="Bitte gib eine gültige E-Mail-Adresse ein." required />);
    const input = screen.getByLabelText(/E-Mail-Adresse/);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-required")).toBe("true");
    const described = (input.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described).toHaveLength(2);
    expect(document.getElementById(described[1] ?? "")?.textContent).toContain("gültige E-Mail-Adresse");
    expect(screen.getByText("(Pflichtfeld)").className).toContain("sr-only");
  });

  it("Select, Textarea, Checkbox und RadioGroup sind beschriftet", () => {
    const onChange = vi.fn();
    render(
      <>
        <Select label="Stundentyp" options={[{ value: "normal", label: "Übungsfahrt" }, { value: "night", label: "Nachtfahrt" }]} placeholder="Bitte wählen" />
        <Textarea label="Kommentar" error="Zu lang" />
        <Checkbox label="Für Schüler sichtbar" description="Der Kommentar erscheint im Profil" />
        <RadioGroup name="view" legend="Ansicht" options={[{ value: "day", label: "Tag" }, { value: "week", label: "Woche" }]} value="day" onChange={onChange} />
      </>
    );
    expect(screen.getByLabelText("Stundentyp").tagName).toBe("SELECT");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByLabelText("Kommentar").getAttribute("aria-invalid")).toBe("true");
    const checkbox = screen.getByRole("checkbox", { name: /Für Schüler sichtbar/ });
    expect(checkbox.getAttribute("aria-describedby")).toBeTruthy();
    const group = screen.getByRole("group", { name: "Ansicht" });
    expect(group.tagName).toBe("FIELDSET");
    fireEvent.click(screen.getByLabelText("Woche"));
    expect(onChange).toHaveBeenCalledWith("week");
  });
});

describe("Rückmeldungen", () => {
  it("Alert wählt role nach Ton und ist schließbar", () => {
    const onDismiss = vi.fn();
    render(<Alert tone="danger" title="Speichern fehlgeschlagen" onDismiss={onDismiss}>Ursache: Netzwerk</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Fehler:");
    fireEvent.click(screen.getByLabelText("Ausblenden"));
    expect(onDismiss).toHaveBeenCalled();
    cleanup();
    render(<Alert tone="success" title="Gespeichert" />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("ToastRegion ist eine Live-Region und schließt Einträge", () => {
    const onDismiss = vi.fn();
    render(<ToastRegion label="Benachrichtigungen" onDismiss={onDismiss} toasts={[{ id: "1", tone: "success", title: "Termin gebucht" }, { id: "2", tone: "danger", title: "Zahlung fehlgeschlagen" }]} />);
    const region = screen.getByRole("region", { name: "Benachrichtigungen" });
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("status").textContent).toContain("Termin gebucht");
    expect(screen.getByRole("alert").textContent).toContain("Zahlung fehlgeschlagen");
    fireEvent.click(screen.getAllByLabelText("Ausblenden")[0] as HTMLElement);
    expect(onDismiss).toHaveBeenCalledWith("1");
  });

  it("ProgressBar und ProgressRing tragen ARIA-Werte", () => {
    render(
      <>
        <ProgressBar value={12} max={30} label="Tagesziel" valueText="12 von 30 Fragen" />
        <ProgressRing value={150} label="Ring" />
      </>
    );
    const bar = screen.getByRole("progressbar", { name: "Tagesziel" });
    expect(bar.getAttribute("aria-valuenow")).toBe("12");
    expect(bar.getAttribute("aria-valuemax")).toBe("30");
    expect((bar.firstElementChild as HTMLElement).style.width).toBe("40%");
    expect(screen.getByRole("progressbar", { name: "Ring" }).getAttribute("aria-valuenow")).toBe("100");
  });

  it("VisuallyHidden ist nur für Screenreader", () => {
    render(<VisuallyHidden>Nur vorgelesen</VisuallyHidden>);
    expect(screen.getByText("Nur vorgelesen").className).toContain("sr-only");
  });
});

describe("Navigation", () => {
  it("BottomTabBar markiert die aktive Seite und meldet Badges", () => {
    render(<BottomTabBar label="Hauptnavigation" items={[{ href: "/heute", label: "Heute", active: true }, { href: "/nachrichten", label: "Nachrichten", icon: <span>i</span>, badge: 3, badgeLabel: "3 ungelesene Nachrichten" }]} />);
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Heute" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /3 ungelesene Nachrichten/ })).toBeTruthy();
  });

  it("SidebarNav rendert Gruppen und nutzt die Link-Komponente", () => {
    const Link = ({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string; "aria-current"?: "page" | undefined }) => <a href={href} className={className} data-custom="1" {...rest}>{children}</a>;
    render(<SidebarNav label="Bereiche" linkComponent={Link} groups={[{ label: "Verwaltung", items: [{ href: "/schueler", label: "Schüler", active: true }, { href: "/team", label: "Team" }] }]} />);
    expect(screen.getByText("Verwaltung")).toBeTruthy();
    const active = screen.getByRole("link", { name: "Schüler" });
    expect(active.getAttribute("aria-current")).toBe("page");
    expect(active.getAttribute("data-custom")).toBe("1");
  });
});

describe("CalendarGrid", () => {
  it("Monatsraster hat 42 Zellen, Wochentage und markiert heute", () => {
    const today = new Date(2026, 8, 14);
    render(<CalendarMonthGrid year={2026} month={8} today={today} label="September 2026" weekdayLabels={["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]} renderDay={(d) => <span>{d.date.getDate()}</span>} />);
    expect(screen.getByRole("grid", { name: "September 2026" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(42);
    expect(cells.filter((c) => c.getAttribute("aria-current") === "date")).toHaveLength(1);
    expect(getMonthGridDays(2026, 8)[0]?.getDate()).toBe(31);
  });

  it("Zeitraster positioniert Ereignisse nach Uhrzeit", () => {
    const days = getWeekDays(new Date(2026, 8, 14));
    expect(days).toHaveLength(7);
    expect(days[0]?.getDay()).toBe(1);
    render(
      <CalendarTimeGrid
        days={days}
        startHour={8}
        endHour={12}
        hourHeight={60}
        label="Woche"
        renderColumnHeader={(d) => d.getDate()}
        renderColumn={(d, layout) => (d.getDate() === 14 ? <div data-testid="event" {...layout(new Date(2026, 8, 14, 9, 30), new Date(2026, 8, 14, 11, 0))}>Fahrstunde</div> : null)}
      />
    );
    const event = screen.getByTestId("event");
    expect(event.style.top).toBe("90px");
    expect(event.style.height).toBe("90px");
    expect(timeToOffset(new Date(2026, 8, 14, 8, 15), 8, 60)).toBe(15);
  });
});
