// Vorfahrt-Trainer: Situationen in Draufsicht, bei denen die Reihenfolge der Fahrzeuge bestimmt werden muss.
// Regeln nach § 8 StVO (rechts vor links, Vorfahrtstraße, Zeichen 205/206), § 9 StVO (Abbiegen, Gegenverkehr),
// § 38 StVO (Einsatzfahrzeuge), § 8 Abs. 1a StVO (Kreisverkehr). Rechtsstand 1.9.2026. Eigene Formulierungen.
import { LEGAL_BASIS_DATE, type LegalBasisDate, type ReviewStatus } from "./types";

export interface PriorityVehicle { key: string; label: string }
export interface PriorityScenario {
  id: string;
  /** Medien-ID der Situationsgrafik (packages/content/media/manifest.json). */
  media: string;
  title: string;
  vehicles: PriorityVehicle[];
  /** Reihenfolge, in der die Fahrzeuge fahren dürfen (Fahrzeug-Keys). Gleichzeitig fahrende Fahrzeuge stehen in einer Gruppe. */
  order: string[][];
  explanation: string;
  legalReference: string;
  /** 1 leicht bis 5 schwer */
  level: 1 | 2 | 3 | 4 | 5;
  legalBasisDate: LegalBasisDate;
  reviewStatus: ReviewStatus;
}

const s = (x: Omit<PriorityScenario, "legalBasisDate" | "reviewStatus"> & Partial<Pick<PriorityScenario, "reviewStatus">>): PriorityScenario => ({ legalBasisDate: LEGAL_BASIS_DATE, reviewStatus: "published", ...x });

export const priorityScenarios: readonly PriorityScenario[] = [
  s({ id: "rvl-a-rechts", media: "vorfahrt-rechts-vor-links", title: "Kreuzung ohne Zeichen", vehicles: [{ key: "sie", label: "Sie" }, { key: "a", label: "A (von rechts)" }], order: [["a"], ["sie"]], level: 1,
    explanation: "Ohne Verkehrszeichen gilt rechts vor links. A kommt für Sie von rechts und fährt zuerst.", legalReference: "§ 8 Abs. 1 StVO" }),
  s({ id: "t-einmuendung", media: "vorfahrt-t-einmuendung", title: "T-Einmündung ohne Zeichen", vehicles: [{ key: "sie", label: "Sie (durchgehend)" }, { key: "a", label: "A (aus der Einmündung)" }], order: [["a"], ["sie"]], level: 2,
    explanation: "Auch an einer Einmündung ohne Zeichen gilt rechts vor links. A kommt von rechts, die durchgehende Straße hat keine Vorfahrt von selbst.", legalReference: "§ 8 Abs. 1 StVO" }),
  s({ id: "grundstuecksausfahrt", media: "vorfahrt-grundstuecksausfahrt", title: "Aus der Grundstücksausfahrt", vehicles: [{ key: "sie", label: "Sie (Ausfahrt)" }, { key: "b", label: "B (auf der Straße)" }], order: [["b"], ["sie"]], level: 1,
    explanation: "Wer aus einem Grundstück auf die Straße fährt, muss allen anderen Vorrang lassen; rechts vor links gilt hier nicht.", legalReference: "§ 10 StVO" }),
  s({ id: "links-gegenverkehr", media: "vorfahrt-linksabbiegen-gegenverkehr", title: "Linksabbiegen mit Gegenverkehr", vehicles: [{ key: "sie", label: "Sie (links)" }, { key: "a", label: "A (geradeaus)" }], order: [["a"], ["sie"]], level: 2,
    explanation: "Linksabbieger müssen den entgegenkommenden Geradeausverkehr durchfahren lassen.", legalReference: "§ 9 Abs. 3 StVO" }),
  s({ id: "einsatzfahrzeug", media: "vorfahrt-einsatzfahrzeug", title: "Einsatzfahrzeug von links", vehicles: [{ key: "sie", label: "Sie (Vorfahrtstraße)" }, { key: "e", label: "Einsatzfahrzeug" }], order: [["e"], ["sie"]], level: 2,
    explanation: "Blaulicht mit Einsatzhorn bedeutet: sofort freie Bahn schaffen. Das gilt auch auf der Vorfahrtstraße.", legalReference: "§ 38 Abs. 1 StVO" }),
  s({ id: "abknickend", media: "vorfahrt-abknickend", title: "Abknickende Vorfahrtstraße", vehicles: [{ key: "sie", label: "Sie (folgen der Vorfahrtstraße)" }, { key: "b", label: "B (von oben)" }, { key: "c", label: "C (von rechts)" }], order: [["sie"], ["b"], ["c"]], level: 4,
    explanation: "Sie folgen der abknickenden Vorfahrtstraße und fahren zuerst. B und C sind wartepflichtig; untereinander gilt rechts vor links: B kommt für C von rechts, also B vor C.", legalReference: "§ 8 Abs. 1 und 2 StVO, Zeichen 306 mit Zusatzzeichen 1002" }),
  s({ id: "rvl-drei", media: "vorfahrt-rvl-drei", title: "Drei Fahrzeuge, rechts vor links", vehicles: [{ key: "sie", label: "Sie (von unten)" }, { key: "a", label: "A (von rechts)" }, { key: "b", label: "B (von links)" }], order: [["a"], ["sie"], ["b"]], level: 3,
    explanation: "Reihum rechts vor links: A hat rechts niemanden und fährt zuerst, dann Sie (A war rechts von Ihnen), zuletzt B (Sie waren rechts von B).", legalReference: "§ 8 Abs. 1 StVO" }),
  s({ id: "feldweg", media: "vorfahrt-feldweg", title: "Feldweg auf Landstraße", vehicles: [{ key: "sie", label: "Sie (Landstraße)" }, { key: "b", label: "B (aus dem Feldweg)" }], order: [["sie"], ["b"]], level: 2,
    explanation: "Wer aus einem Feld- oder Waldweg auf eine andere Straße fährt, hat keine Vorfahrt, auch wenn er von rechts kommt.", legalReference: "§ 8 Abs. 1 Satz 2 Nr. 2 StVO" }),
  s({ id: "ampel-aus", media: "vorfahrt-ampel-ausgefallen", title: "Ampel ausgefallen, Zeichen 205", vehicles: [{ key: "sie", label: "Sie (Vorfahrt gewähren)" }, { key: "a", label: "A (von links)" }], order: [["a"], ["sie"]], level: 3,
    explanation: "Ist die Ampel dunkel, gelten die Verkehrszeichen. Zeichen 205 an Ihrer Zufahrt: A auf der Vorfahrtstraße fährt zuerst.", legalReference: "§ 37 Abs. 1 und § 8 Abs. 1 StVO" }),
  s({ id: "radweg-rechts", media: "vorfahrt-rechtsabbiegen-radweg", title: "Rechtsabbiegen, Radfahrer geradeaus", vehicles: [{ key: "sie", label: "Sie (rechts abbiegen)" }, { key: "r", label: "Radfahrer (geradeaus)" }], order: [["r"], ["sie"]], level: 2,
    explanation: "Beim Abbiegen müssen Sie Radfahrende, die auf dem Radweg geradeaus weiterfahren, durchfahren lassen. Schulterblick!", legalReference: "§ 9 Abs. 3 StVO" }),
  s({ id: "kreisel-beschildert", media: "kreisverkehr-beschildert", title: "Kreisverkehr mit Zeichen 215 und 205", vehicles: [{ key: "sie", label: "Sie (einfahren)" }, { key: "a", label: "A (im Kreis)" }], order: [["a"], ["sie"]], level: 1,
    explanation: "Mit Zeichen 215 und 205 hat der Verkehr im Kreis Vorfahrt. Sie warten, bis A vorbei ist.", legalReference: "§ 8 Abs. 1a StVO" }),
  s({ id: "kreisel-ohne", media: "kreisverkehr-ohne-zeichen", title: "Kreisverkehr ohne Zeichen", vehicles: [{ key: "sie", label: "Sie (im Kreis)" }, { key: "a", label: "A (will einfahren)" }], order: [["a"], ["sie"]], level: 4,
    explanation: "Ohne Zeichen 215 mit 205 gilt auch im Kreisverkehr rechts vor links: A kommt für Sie von rechts und darf zuerst einfahren.", legalReference: "§ 8 Abs. 1 StVO" }),
  s({ id: "vorfahrtstrasse-a-205", media: "vt-vorfahrtstrasse-sie-a", title: "Sie auf der Vorfahrtstraße", vehicles: [{ key: "sie", label: "Sie (Zeichen 306)" }, { key: "a", label: "A (Zeichen 205)" }], order: [["sie"], ["a"]], level: 1,
    explanation: "Zeichen 306 gibt Ihnen Vorfahrt, A muss mit Zeichen 205 warten, obwohl A von rechts kommt.", legalReference: "§ 8 Abs. 1 StVO, Zeichen 306 und 205" }),
  s({ id: "stop-links", media: "vt-stop-sie-a-links", title: "Stoppschild, Verkehr von links", vehicles: [{ key: "sie", label: "Sie (Stopp)" }, { key: "a", label: "A (Vorfahrtstraße)" }], order: [["a"], ["sie"]], level: 1,
    explanation: "Am Stoppschild müssen Sie anhalten und Vorfahrt gewähren, auch wenn A von links kommt.", legalReference: "§ 41 StVO, Zeichen 206" }),
  s({ id: "rvl-links-abbiegen", media: "vt-rvl-sie-links-abbiegen-a-rechts", title: "Rechts vor links, Sie biegen links ab", vehicles: [{ key: "sie", label: "Sie (links)" }, { key: "a", label: "A (von rechts, geradeaus)" }], order: [["a"], ["sie"]], level: 2,
    explanation: "A kommt von rechts und hat Vorfahrt. Dass Sie abbiegen, ändert daran nichts.", legalReference: "§ 8 Abs. 1 StVO" }),
  s({ id: "rvl-drei-sie-links", media: "vt-rvl-drei-sie-links", title: "Drei Fahrzeuge, Sie von links", vehicles: [{ key: "sie", label: "Sie (von links)" }, { key: "a", label: "A (von unten)" }, { key: "b", label: "B (von rechts)" }], order: [["b"], ["a"], ["sie"]], level: 4,
    explanation: "Rechts vor links reihum: B hat rechts niemanden und fährt zuerst, dann A (B war rechts von A), zuletzt Sie (A ist rechts von Ihnen).", legalReference: "§ 8 Abs. 1 StVO" }),
  s({ id: "gegenverkehr-beide", media: "vt-gegenverkehr-beide-links", title: "Vorfahrtstraße, zwei Abbieger und ein Wartender", vehicles: [{ key: "sie", label: "Sie (links, Vorfahrtstraße)" }, { key: "a", label: "A (rechts, Vorfahrtstraße)" }, { key: "b", label: "B (Zeichen 205)" }], order: [["a"], ["sie"], ["b"]], level: 5,
    explanation: "A und Sie sind beide auf der Vorfahrtstraße. A biegt rechts ab und muss Ihnen als Linksabbieger nicht weichen; Sie müssen Gegenverkehr durchlassen, also A zuerst, dann Sie. B wartet mit Zeichen 205 auf beide.", legalReference: "§ 8 Abs. 1 und § 9 Abs. 3 StVO" }),
  s({ id: "strassenbahn", media: "vt-strassenbahn-rvl", title: "Straßenbahn von links", vehicles: [{ key: "sie", label: "Sie" }, { key: "t", label: "Straßenbahn (von links)" }], order: [["sie"], ["t"]], level: 5,
    explanation: "Auch für Schienenfahrzeuge gilt an Kreuzungen ohne Zeichen rechts vor links: Die Straßenbahn kommt von links und muss warten. In der Praxis rechnen Sie trotzdem mit dem langen Bremsweg der Bahn.", legalReference: "§ 8 Abs. 1 StVO", reviewStatus: "needs_verification" }),
];
