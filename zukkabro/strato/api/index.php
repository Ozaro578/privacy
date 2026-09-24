<?php
// ZUKKABRO – Server-API für Strato (PHP 8.1+).
// Gleiche Schnittstelle wie netlify/functions/api/api.mts: Admin, Händler, Kasse, Pakete, Buchhaltung.
// Alle Geldbeträge in Cent (ganze Zahlen).
declare(strict_types=1);

require_once __DIR__ . '/speicher.php';
require_once __DIR__ . '/sicherheit.php';

const BESTELL_STATUS = ['neu', 'bestaetigt', 'versendet', 'bezahlt', 'abgeschlossen', 'storniert'];
const BUCH_TYPEN = ['einkauf', 'verkauf', 'ausgabe', 'einnahme'];
const MWST_SAETZE = [0, 7, 19];
const FARBEN = ['pink', 'gold', 'blue', 'orange', 'violet', 'green', 'gruen', 'dark', 'rot'];
const LEBENSMITTEL = ['susses', 'snacks', 'scharfes', 'pipapo'];
const STANDARD_EINSTELLUNGEN = [
    'versand' => 590, 'versandfreiAb' => 5000, 'abholung' => true, 'abholort' => '',
    'bankInhaber' => '', 'bankIban' => '', 'bankName' => '', 'paypal' => '', 'hinweis' => '', 'ohnePreisAusblenden' => false,
];

final class Fehler extends Exception {
    public function __construct(public int $status, string $msg) { parent::__construct($msg); }
}

/* =================== Hilfen =================== */
function antwort(mixed $daten, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
/** Leere Zuordnungen als {} statt [] ausgeben */
function obj(array $a): array|stdClass { return $a === [] ? new stdClass() : $a; }

function text(mixed $v, int $max = 200): string {
    if (!is_string($v)) return '';
    $v = trim($v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}
function ganz(mixed $v, int $min, int $max): int {
    if (is_int($v)) $n = $v;
    elseif (is_string($v) && preg_match('/^-?\d+$/', trim($v))) $n = (int) trim($v);
    elseif (is_float($v) && floor($v) == $v) $n = (int) $v;
    else throw new Fehler(400, 'Ungültige Zahl');
    if ($n < $min || $n > $max) throw new Fehler(400, 'Ungültige Zahl');
    return $n;
}
function datum(mixed $v): string {
    $s = text($v, 10);
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) throw new Fehler(400, 'Ungültiges Datum');
    return $s;
}
function ohne_pass(array $h): array { unset($h['passHash']); return $h; }
function email_ok(string $e): bool { return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e); }

function body(): array {
    $roh = file_get_contents('php://input');
    $b = json_decode($roh === false ? '' : $roh, true);
    if (!is_array($b)) throw new Fehler(400, 'Ungültige Anfrage');
    return $b;
}

/** Einfache Bremse gegen Passwort-Raten und Spam (pro IP und Aktion) */
function bremse(string $aktion, string $ip, int $max, int $fensterMin): void {
    $key = 'limit/' . kurz_hash($aktion . '|' . $ip);
    $jetzt = (int) (microtime(true) * 1000);
    $e = lese($key) ?: ['n' => 0, 'seit' => $jetzt];
    if ($jetzt - $e['seit'] > $fensterMin * 60000) { $e = ['n' => 0, 'seit' => $jetzt]; }
    $e['n']++;
    schreibe($key, $e);
    if ($e['n'] > $max) throw new Fehler(429, 'Zu viele Versuche. Bitte später erneut probieren.');
}

function protokoll(string $ereignis, string $von, array $details = []): void {
    $am = jetzt();
    schreibe('protokoll/' . substr($am, 0, 7) . '/' . $am . '-' . substr(kurz_hash($am . random_int(0, PHP_INT_MAX)), 0, 6),
        array_merge(['am' => $am, 'ereignis' => $ereignis, 'von' => $von], $details));
}

function braucht(?array $s, string $rolle): array {
    if (!$s || $s['r'] !== $rolle) throw new Fehler(401, 'Bitte anmelden.');
    return $s;
}

/* =================== Sortiment & Pakete =================== */
function sortiment(): array {
    static $s = null;
    if ($s === null) $s = json_decode((string) file_get_contents(__DIR__ . '/sortiment.json'), true) ?: [];
    return $s;
}
function produkt(string $id): ?array { return sortiment()[$id] ?? null; }
function mwst_vorschlag(string $id): int {
    $k = produkt($id)['k'] ?? [];
    if (array_intersect($k, ['getraenke', 'vapes', 'elfbar'])) return 19;
    return array_intersect($k, LEBENSMITTEL) ? 7 : 19;
}
function alter_jahre(string $geb): int { return (new DateTimeImmutable($geb))->diff(new DateTimeImmutable('today'))->y; }
function mwst_aus_brutto(int $brutto, int $satz): int { return (int) round($brutto * $satz / (100 + $satz)); }

function pakete(): array {
    $p = lese('pakete/alle');
    if (is_array($p)) return $p;
    return json_decode((string) file_get_contents(__DIR__ . '/pakete-vorlage.json'), true) ?: [];
}
function paket_status(array $pk): array {
    $inhalte = [];
    foreach ($pk['inhalt'] as $i) { $p = produkt($i['id']); if ($p) $inhalte[] = $p; }
    $voll = count($inhalte) === count($pk['inhalt']) && count($inhalte) > 0;
    $ab18 = false; $aus = false;
    foreach ($inhalte as $p) { if (!empty($p['a'])) $ab18 = true; if (!empty($p['x'])) $aus = true; }
    return ['ab18' => $ab18, 'lieferbar' => $voll && !$aus];
}

/* =================== Konten =================== */
function login(string $ip): never {
    $b = body();
    $rolle = ($b['rolle'] ?? '') === 'admin' ? 'admin' : 'haendler';
    $benutzer = strtolower(text($b['benutzer'] ?? '', 120));
    $passwort = is_string($b['passwort'] ?? null) ? substr($b['passwort'], 0, 200) : '';
    bremse('login-' . $rolle, $ip, 10, 15);
    if ($rolle === 'admin') {
        $konten = admin_konten();
        $hash = $konten[$benutzer] ?? '';
        $ok = $hash !== '' && password_verify($passwort, $hash);
        if (!$ok) { protokoll('admin-login-fehlgeschlagen', $benutzer, ['ip' => kurz_hash($ip)]); throw new Fehler(401, 'Benutzername oder Passwort falsch.'); }
        protokoll('admin-login', $benutzer);
        sitzung_setzen('admin', $benutzer, $benutzer);
        antwort(['ok' => true, 'rolle' => 'admin', 'name' => $benutzer]);
    }
    $id = lese('haendler-email/' . kurz_hash($benutzer));
    $h = is_string($id) ? lese('haendler/' . $id) : null;
    $ok = password_verify($passwort, $h['passHash'] ?? '$2y$10$ausgleichausgleichausgleichausgleichausgleichausgle');
    if (!$h || !$ok) throw new Fehler(401, 'Benutzername oder Passwort falsch.');
    if ($h['status'] === 'offen') throw new Fehler(403, 'Dein Händlerkonto wird noch geprüft. Wir melden uns bei dir.');
    if ($h['status'] === 'gesperrt') throw new Fehler(403, 'Dieses Händlerkonto ist gesperrt.');
    protokoll('haendler-login', $h['id']);
    sitzung_setzen('haendler', $h['id'], $h['firma']);
    antwort(['ok' => true, 'rolle' => 'haendler', 'name' => $h['firma']]);
}

function registrieren(string $ip): never {
    bremse('registrieren', $ip, 5, 60);
    $b = body();
    $email = strtolower(text($b['email'] ?? '', 120));
    $passwort = is_string($b['passwort'] ?? null) ? $b['passwort'] : '';
    $h = [
        'id' => neue_id('H-'), 'firma' => text($b['firma'] ?? '', 120), 'ansprechpartner' => text($b['ansprechpartner'] ?? '', 120), 'email' => $email,
        'telefon' => text($b['telefon'] ?? '', 40), 'strasse' => text($b['strasse'] ?? '', 120), 'plz' => text($b['plz'] ?? '', 10), 'ort' => text($b['ort'] ?? '', 80),
        'ustId' => text($b['ustId'] ?? '', 30), 'passHash' => '', 'status' => 'offen', 'erstellt' => jetzt(),
    ];
    if (!$h['firma'] || !$h['ansprechpartner'] || !$h['strasse'] || !$h['plz'] || !$h['ort']) throw new Fehler(400, 'Bitte alle Pflichtfelder ausfüllen.');
    if (!email_ok($email)) throw new Fehler(400, 'Bitte eine gültige E-Mail-Adresse angeben.');
    if (strlen($passwort) < 10 || strlen($passwort) > 200) throw new Fehler(400, 'Das Passwort braucht mindestens 10 Zeichen.');
    if (($b['gewerbe'] ?? null) !== true || ($b['datenschutz'] ?? null) !== true) throw new Fehler(400, 'Bitte die Bestätigungen ankreuzen.');
    $index = 'haendler-email/' . kurz_hash($email);
    if (lese($index)) throw new Fehler(409, 'Für diese E-Mail gibt es schon ein Konto.');
    $h['passHash'] = password_hash($passwort, PASSWORD_DEFAULT);
    schreibe('haendler/' . $h['id'], $h);
    schreibe($index, $h['id']);
    protokoll('haendler-registriert', $h['id'], ['firma' => $h['firma']]);
    antwort(['ok' => true, 'meldung' => 'Danke! Wir prüfen deine Angaben und schalten dein Konto frei.']);
}

function ich(?array $s): never {
    if (!$s) antwort(['angemeldet' => false]);
    if ($s['r'] === 'haendler') {
        $h = lese('haendler/' . $s['id']);
        if (!$h || $h['status'] !== 'aktiv') { sitzung_beenden(); antwort(['angemeldet' => false]); }
        antwort(['angemeldet' => true, 'rolle' => 'haendler', 'name' => $h['firma'], 'haendler' => ohne_pass($h)]);
    }
    antwort(['angemeldet' => true, 'rolle' => $s['r'], 'name' => $s['n']]);
}

function aktiver_haendler(?array $s): array {
    $sitz = braucht($s, 'haendler');
    $h = lese('haendler/' . $sitz['id']);
    if (!$h || $h['status'] !== 'aktiv') throw new Fehler(401, 'Bitte erneut anmelden.');
    return $h;
}

/* =================== Preise =================== */
function preisliste(): array { $p = lese('preise/haendler'); return is_array($p) ? $p : []; }
function shop_preise(): array { $p = lese('preise/shop'); return is_array($p) ? $p : []; }
function einstellungen(): array { $e = lese('einstellungen/shop'); return array_merge(STANDARD_EINSTELLUNGEN, is_array($e) ? $e : []); }

function mwst_pruefen(mixed $v): int {
    $m = ganz($v, 0, 19);
    if (!in_array($m, MWST_SAETZE, true)) throw new Fehler(400, 'MwSt-Satz muss 0, 7 oder 19 sein.');
    return $m;
}

function preise_speichern(array $s): never {
    $b = body();
    $aend = is_array($b['aenderungen'] ?? null) ? $b['aenderungen'] : [];
    $liste = preisliste(); $n = 0;
    foreach ($aend as $id => $wert) {
        $pid = text((string) $id, 200);
        if (!$pid || $n++ > 2000) continue;
        if ($wert === null) { unset($liste[$pid]); continue; }
        $liste[$pid] = [
            'name' => text($wert['name'] ?? '', 200) ?: $pid, 'marke' => text($wert['marke'] ?? '', 80),
            'preis' => ganz($wert['preis'] ?? null, 0, 10000000), 've' => ganz($wert['ve'] ?? null, 1, 10000), 'mindest' => ganz($wert['mindest'] ?? null, 1, 10000),
            'mwst' => mwst_pruefen($wert['mwst'] ?? null), 'aktiv' => ($wert['aktiv'] ?? true) !== false,
        ];
    }
    schreibe('preise/haendler', obj($liste));
    protokoll('preise-geaendert', $s['id'], ['anzahl' => count($aend)]);
    antwort(['ok' => true, 'preise' => obj($liste)]);
}

function shop_preise_speichern(array $s): never {
    $b = body();
    $aend = is_array($b['aenderungen'] ?? null) ? $b['aenderungen'] : [];
    $liste = shop_preise(); $n = 0;
    foreach ($aend as $id => $wert) {
        $pid = text((string) $id, 200);
        if (!$pid || $n++ > 2000) continue;
        if ($wert === null) { unset($liste[$pid]); continue; }
        $liste[$pid] = ['preis' => ganz($wert['preis'] ?? null, 1, 10000000), 'mwst' => mwst_pruefen($wert['mwst'] ?? null)];
    }
    schreibe('preise/shop', obj($liste));
    protokoll('shoppreise-geaendert', $s['id'], ['anzahl' => count($aend)]);
    antwort(['ok' => true, 'shop' => obj($liste)]);
}

function einstellungen_speichern(array $s): never {
    $b = body();
    $e = [
        'versand' => ganz($b['versand'] ?? null, 0, 100000), 'versandfreiAb' => ganz($b['versandfreiAb'] ?? null, 0, 10000000),
        'abholung' => ($b['abholung'] ?? null) === true, 'abholort' => text($b['abholort'] ?? '', 200),
        'bankInhaber' => text($b['bankInhaber'] ?? '', 100), 'bankIban' => preg_replace('/\s+/', ' ', text($b['bankIban'] ?? '', 40)), 'bankName' => text($b['bankName'] ?? '', 100),
        'paypal' => text($b['paypal'] ?? '', 200), 'hinweis' => text($b['hinweis'] ?? '', 1000), 'ohnePreisAusblenden' => ($b['ohnePreisAusblenden'] ?? null) === true,
    ];
    schreibe('einstellungen/shop', $e);
    protokoll('einstellungen-geaendert', $s['id']);
    antwort(['ok' => true, 'einstellungen' => $e]);
}

/* =================== Pakete =================== */
function pakete_speichern(array $s): never {
    $b = body();
    $roh = is_array($b['pakete'] ?? null) ? array_slice($b['pakete'], 0, 60) : [];
    $ids = []; $liste = [];
    foreach ($roh as $r) {
        $id = trim(preg_replace('/-+/', '-', preg_replace('/[^a-z0-9-]/', '-', strtolower(text($r['id'] ?? '', 60)))), '-');
        if (!$id || isset($ids[$id])) throw new Fehler(400, 'Jedes Paket braucht eine eigene Kennung.');
        $ids[$id] = true;
        $name = text($r['name'] ?? '', 80);
        if (!$name) throw new Fehler(400, 'Jedes Paket braucht einen Namen.');
        $inhalt = [];
        foreach (array_slice(is_array($r['inhalt'] ?? null) ? $r['inhalt'] : [], 0, 40) as $i) {
            $pid = text($i['id'] ?? '', 200);
            if (!produkt($pid)) throw new Fehler(400, "$name: Produkt $pid gibt es nicht im Sortiment.");
            $inhalt[] = ['id' => $pid, 'menge' => ganz($i['menge'] ?? null, 1, 99)];
        }
        if (!$inhalt) throw new Fehler(400, "$name: Bitte mindestens ein Produkt hinzufügen.");
        $preis = $r['preis'] ?? null;
        $liste[] = [
            'id' => $id, 'name' => $name, 'untertitel' => text($r['untertitel'] ?? '', 160), 'emoji' => text($r['emoji'] ?? '', 16) ?: '🎁',
            'farbe' => in_array($r['farbe'] ?? '', FARBEN, true) ? $r['farbe'] : 'pink', 'inhalt' => $inhalt,
            'preis' => ($preis === null || $preis === '') ? null : ganz($preis, 1, 10000000),
            'mwst' => mwst_pruefen($r['mwst'] ?? null), 'aktiv' => ($r['aktiv'] ?? true) !== false,
        ];
    }
    schreibe('pakete/alle', $liste);
    protokoll('pakete-geaendert', $s['id'], ['anzahl' => count($liste)]);
    antwort(['ok' => true, 'pakete' => $liste]);
}

/* =================== Shop (Endkunden) =================== */
function zahlarten(array $e): array {
    $z = ['Überweisung (Vorkasse)'];
    if ($e['paypal']) $z[] = 'PayPal';
    if ($e['abholung']) $z[] = 'Bar bei Abholung';
    return $z;
}

function shop_daten(): never {
    $preise = shop_preise(); $e = einstellungen();
    $nur = [];
    foreach ($preise as $id => $p) if (produkt((string) $id)) $nur[$id] = $p['preis'];
    $pk = [];
    foreach (pakete() as $p) {
        if (!$p['aktiv']) continue;
        $pk[] = array_merge(['id' => $p['id'], 'name' => $p['name'], 'untertitel' => $p['untertitel'], 'emoji' => $p['emoji'], 'farbe' => $p['farbe'],
            'inhalt' => $p['inhalt'], 'preis' => $p['preis']], paket_status($p));
    }
    antwort([
        'preise' => obj($nur),
        'versand' => ['kosten' => $e['versand'], 'freiAb' => $e['versandfreiAb'], 'abholung' => $e['abholung'], 'abholort' => $e['abholort']],
        'zahlarten' => zahlarten($e), 'ohnePreisAusblenden' => (bool) $e['ohnePreisAusblenden'], 'pakete' => $pk,
    ]);
}

function kasse(string $ip): never {
    bremse('kasse', $ip, 10, 60);
    $b = body();
    $preise = shop_preise(); $e = einstellungen(); $allePakete = pakete();
    $k = is_array($b['kunde'] ?? null) ? $b['kunde'] : [];
    $kunde = [
        'vorname' => text($k['vorname'] ?? '', 80), 'nachname' => text($k['nachname'] ?? '', 80), 'email' => strtolower(text($k['email'] ?? '', 120)),
        'telefon' => text($k['telefon'] ?? '', 40), 'strasse' => text($k['strasse'] ?? '', 120), 'plz' => text($k['plz'] ?? '', 10), 'ort' => text($k['ort'] ?? '', 80),
    ];
    $lieferart = ($b['lieferart'] ?? '') === 'abholung' ? 'abholung' : 'versand';
    if ($lieferart === 'abholung' && !$e['abholung']) throw new Fehler(400, 'Abholung ist zurzeit nicht möglich.');
    if (!$kunde['vorname'] || !$kunde['nachname']) throw new Fehler(400, 'Bitte Vor- und Nachnamen angeben.');
    if (!email_ok($kunde['email'])) throw new Fehler(400, 'Bitte eine gültige E-Mail-Adresse angeben.');
    if ($lieferart === 'versand' && (!$kunde['strasse'] || !$kunde['plz'] || !$kunde['ort'])) throw new Fehler(400, 'Bitte die vollständige Lieferadresse angeben.');
    $zahlart = text($b['zahlart'] ?? '', 40);
    if (!in_array($zahlart, zahlarten($e), true)) throw new Fehler(400, 'Bitte eine Zahlungsart wählen.');
    if ($zahlart === 'Bar bei Abholung' && $lieferart !== 'abholung') throw new Fehler(400, 'Barzahlung geht nur bei Abholung.');
    if (($b['agb'] ?? null) !== true || ($b['datenschutz'] ?? null) !== true) throw new Fehler(400, 'Bitte AGB, Widerrufsbelehrung und Datenschutz bestätigen.');

    $positionen = []; $ab18 = false;
    foreach (array_slice(is_array($b['positionen'] ?? null) ? $b['positionen'] : [], 0, 100) as $r) {
        $id = text($r['produktId'] ?? '', 200);
        if (str_starts_with($id, 'paket:')) {
            $pk = null;
            foreach ($allePakete as $x) if ($x['id'] === substr($id, 6) && $x['aktiv']) $pk = $x;
            if (!$pk || $pk['preis'] === null) throw new Fehler(400, 'Ein Paket im Warenkorb ist nicht mehr erhältlich. Bitte Warenkorb prüfen.');
            $st = paket_status($pk);
            if (!$st['lieferbar']) throw new Fehler(400, "Paket {$pk['name']} ist gerade nicht vollständig lieferbar.");
            $menge = ganz($r['menge'] ?? null, 1, 99);
            if ($st['ab18']) $ab18 = true;
            $brutto = $menge * $pk['preis']; $mw = mwst_aus_brutto($brutto, $pk['mwst']);
            $positionen[] = ['produktId' => $id, 'name' => 'Paket: ' . $pk['name'], 've' => 1, 'anzahlVE' => $menge, 'stueck' => $menge,
                'preis' => (int) round($pk['preis'] * 100 / (100 + $pk['mwst'])), 'mwst' => $pk['mwst'], 'netto' => $brutto - $mw, 'brutto' => $brutto];
            continue;
        }
        $prod = produkt($id); $preis = $preise[$id] ?? null;
        if (!$prod || !$preis) throw new Fehler(400, 'Ein Artikel im Warenkorb ist nicht mehr erhältlich. Bitte Warenkorb prüfen.');
        if (!empty($prod['x'])) throw new Fehler(400, "{$prod['n']} ist gerade nicht lieferbar.");
        $menge = ganz($r['menge'] ?? null, 1, 999);
        if (!empty($prod['a'])) $ab18 = true;
        $brutto = $menge * $preis['preis']; $mw = mwst_aus_brutto($brutto, $preis['mwst']);
        $positionen[] = ['produktId' => $id, 'name' => $prod['n'], 've' => 1, 'anzahlVE' => $menge, 'stueck' => $menge,
            'preis' => (int) round($preis['preis'] * 100 / (100 + $preis['mwst'])), 'mwst' => $preis['mwst'], 'netto' => $brutto - $mw, 'brutto' => $brutto];
    }
    if (!$positionen) throw new Fehler(400, 'Dein Warenkorb ist leer.');
    if ($ab18) {
        $gd = datum($b['geburtsdatum'] ?? '');
        if (alter_jahre($gd) < 18) throw new Fehler(403, 'Artikel ab 18 dürfen wir nur an Volljährige verkaufen.');
        if (($b['ab18Bestaetigt'] ?? null) !== true) throw new Fehler(400, 'Bitte bestätige, dass du mindestens 18 Jahre alt bist.');
        $kunde['geburtsdatum'] = $gd;
    }
    $waren = array_sum(array_column($positionen, 'brutto'));
    $versand = ($lieferart === 'versand' && !($e['versandfreiAb'] > 0 && $waren >= $e['versandfreiAb'])) ? (int) $e['versand'] : 0;
    $mwst = 0; foreach ($positionen as $p) $mwst += $p['brutto'] - $p['netto'];
    $mwst += mwst_aus_brutto($versand, 19);
    $brutto = $waren + $versand;
    $best = [
        'id' => neue_id('ZK-'), 'art' => 'kunde', 'haendlerId' => '', 'firma' => $kunde['vorname'] . ' ' . $kunde['nachname'], 'positionen' => $positionen,
        'netto' => $brutto - $mwst, 'mwst' => $mwst, 'brutto' => $brutto, 'notiz' => text($b['notiz'] ?? '', 1000), 'status' => 'neu', 'erstellt' => jetzt(),
        'verlauf' => [['status' => 'neu', 'von' => 'Kunde', 'am' => jetzt()]], 'kunde' => $kunde, 'lieferart' => $lieferart, 'zahlart' => $zahlart,
        'versand' => $versand, 'ab18' => $ab18,
    ];
    schreibe('bestellungen/' . $best['id'], $best);
    protokoll('kundenbestellung-neu', $kunde['email'], ['bestellung' => $best['id'], 'brutto' => $brutto]);
    if (str_starts_with($zahlart, 'Überweisung')) $info = ['art' => 'ueberweisung', 'inhaber' => $e['bankInhaber'], 'iban' => $e['bankIban'], 'bank' => $e['bankName'], 'betrag' => $brutto, 'verwendungszweck' => $best['id']];
    elseif ($zahlart === 'PayPal') $info = ['art' => 'paypal', 'ziel' => $e['paypal'], 'betrag' => $brutto, 'verwendungszweck' => $best['id']];
    else $info = ['art' => 'bar', 'betrag' => $brutto, 'abholort' => $e['abholort']];
    antwort(['ok' => true, 'nr' => $best['id'], 'brutto' => $brutto, 'versand' => $versand, 'zahlungsinfo' => $info, 'hinweis' => $e['hinweis'], 'ab18' => $ab18]);
}

/* =================== Händler-Bestellungen =================== */
function bestellen(array $h): never {
    $b = body(); $liste = preisliste(); $positionen = [];
    foreach (array_slice(is_array($b['positionen'] ?? null) ? $b['positionen'] : [], 0, 300) as $p) {
        $pid = text($p['produktId'] ?? '', 200);
        $preis = $liste[$pid] ?? null;
        if (!$preis || !$preis['aktiv']) throw new Fehler(400, "Produkt nicht bestellbar: $pid");
        $anzahlVE = ganz($p['anzahlVE'] ?? null, 1, 10000);
        if ($anzahlVE < $preis['mindest']) throw new Fehler(400, "{$preis['name']}: Mindestens {$preis['mindest']} VE.");
        $stueck = $anzahlVE * $preis['ve'];
        $positionen[] = ['produktId' => $pid, 'name' => $preis['name'], 've' => $preis['ve'], 'anzahlVE' => $anzahlVE, 'stueck' => $stueck,
            'preis' => $preis['preis'], 'mwst' => $preis['mwst'], 'netto' => $stueck * $preis['preis']];
    }
    if (!$positionen) throw new Fehler(400, 'Der Warenkorb ist leer.');
    $netto = array_sum(array_column($positionen, 'netto'));
    $mwst = 0; foreach ($positionen as $p) $mwst += (int) round($p['netto'] * $p['mwst'] / 100);
    $best = ['id' => neue_id('ZB-'), 'art' => 'haendler', 'haendlerId' => $h['id'], 'firma' => $h['firma'], 'positionen' => $positionen,
        'netto' => $netto, 'mwst' => $mwst, 'brutto' => $netto + $mwst, 'notiz' => text($b['notiz'] ?? '', 1000), 'status' => 'neu',
        'erstellt' => jetzt(), 'verlauf' => [['status' => 'neu', 'von' => $h['id'], 'am' => jetzt()]]];
    schreibe('bestellungen/' . $best['id'], $best);
    protokoll('bestellung-neu', $h['id'], ['bestellung' => $best['id'], 'brutto' => $best['brutto']]);
    antwort(['ok' => true, 'bestellung' => $best]);
}

function preisanfrage(array $h): never {
    $b = body(); $positionen = [];
    foreach (array_slice(is_array($b['positionen'] ?? null) ? $b['positionen'] : [], 0, 200) as $r) {
        $id = text($r['produktId'] ?? '', 200); $prod = produkt($id);
        if (!$prod) continue;
        $stueck = ganz($r['stueck'] ?? null, 1, 1000000);
        $positionen[] = ['produktId' => $id, 'name' => $prod['n'], 've' => 1, 'anzahlVE' => $stueck, 'stueck' => $stueck, 'preis' => 0, 'mwst' => mwst_vorschlag($id), 'netto' => 0];
    }
    if (!$positionen) throw new Fehler(400, 'Bitte mindestens ein Produkt mit Wunschmenge auswählen.');
    $a = ['id' => neue_id('PA-'), 'art' => 'preisanfrage', 'haendlerId' => $h['id'], 'firma' => $h['firma'], 'positionen' => $positionen,
        'netto' => 0, 'mwst' => 0, 'brutto' => 0, 'notiz' => text($b['notiz'] ?? '', 1000), 'status' => 'neu', 'erstellt' => jetzt(),
        'verlauf' => [['status' => 'neu', 'von' => $h['id'], 'am' => jetzt()]]];
    schreibe('bestellungen/' . $a['id'], $a);
    protokoll('preisanfrage-neu', $h['id'], ['anfrage' => $a['id'], 'artikel' => count($positionen)]);
    antwort(['ok' => true, 'anfrage' => $a]);
}

function bestell_id(mixed $v): string {
    $id = text($v, 40);
    if (!preg_match('/^[A-Z]{2}-\d{8}-[0-9A-F]{8}$/', $id)) throw new Fehler(404, 'Bestellung nicht gefunden.');
    return $id;
}

function bestell_status(array $s): never {
    $b = body(); $id = bestell_id($b['id'] ?? '');
    $status = $b['status'] ?? '';
    if (!in_array($status, BESTELL_STATUS, true)) throw new Fehler(400, 'Unbekannter Status.');
    $best = lese('bestellungen/' . $id);
    if (!$best) throw new Fehler(404, 'Bestellung nicht gefunden.');
    $best['status'] = $status;
    $best['verlauf'][] = ['status' => $status, 'von' => $s['id'], 'am' => jetzt()];
    schreibe('bestellungen/' . $id, $best);
    antwort(['ok' => true, 'bestellung' => $best]);
}

/* =================== Buchhaltung =================== */
function neue_buchung(array $d, string $von): array {
    $b = array_merge($d, ['id' => neue_id('BU-'), 'erfasstVon' => $von, 'erfasstAm' => jetzt()]);
    schreibe('buchungen/' . substr($b['datum'], 0, 4) . '/' . $b['erfasstAm'] . '-' . $b['id'], $b);
    return $b;
}

function bestellung_buchen(array $s): never {
    $b = body(); $id = bestell_id($b['id'] ?? '');
    $best = lese('bestellungen/' . $id);
    if (!$best) throw new Fehler(404, 'Bestellung nicht gefunden.');
    if (!empty($best['gebucht'])) throw new Fehler(409, 'Diese Bestellung ist schon gebucht.');
    if ($best['status'] === 'storniert') throw new Fehler(400, 'Stornierte Bestellungen können nicht gebucht werden.');
    if (($best['art'] ?? '') === 'preisanfrage') throw new Fehler(400, 'Preisanfragen sind keine Verkäufe und werden nicht gebucht.');
    $tag = substr(jetzt(), 0, 10);
    $zahlung = text($b['zahlungsart'] ?? '', 40) ?: ($best['zahlart'] ?? '') ?: 'Rechnung';
    $wer = (($best['art'] ?? '') === 'kunde' ? 'Kunde: ' : 'Händler: ') . $best['firma'];
    foreach ($best['positionen'] as $p) {
        $betrag = isset($p['brutto']) ? (int) $p['brutto'] : $p['netto'] + (int) round($p['netto'] * $p['mwst'] / 100);
        neue_buchung(['typ' => 'verkauf', 'datum' => $tag, 'produktId' => $p['produktId'], 'name' => $p['name'], 'menge' => $p['stueck'],
            'einzelpreis' => (int) round($betrag / $p['stueck']), 'betrag' => $betrag, 'mwst' => $p['mwst'], 'zahlungsart' => $zahlung,
            'beleg' => $best['id'], 'notiz' => $wer], $s['id']);
    }
    if (!empty($best['versand'])) {
        neue_buchung(['typ' => 'einnahme', 'datum' => $tag, 'produktId' => '', 'name' => 'Versandkosten', 'menge' => 1, 'einzelpreis' => $best['versand'],
            'betrag' => $best['versand'], 'mwst' => 19, 'zahlungsart' => $zahlung, 'beleg' => $best['id'], 'notiz' => $wer], $s['id']);
    }
    $best['gebucht'] = true;
    $best['verlauf'][] = ['status' => $best['status'], 'von' => $s['id'] . ' (gebucht)', 'am' => jetzt()];
    schreibe('bestellungen/' . $id, $best);
    antwort(['ok' => true, 'bestellung' => $best]);
}

function buchung_anlegen(array $s): never {
    $b = body();
    $typ = $b['typ'] ?? '';
    if (!in_array($typ, BUCH_TYPEN, true)) throw new Fehler(400, 'Unbekannte Buchungsart.');
    $mwst = mwst_pruefen($b['mwst'] ?? null);
    $menge = ganz($b['menge'] ?? 1, 1, 1000000);
    $einzel = ganz($b['einzelpreis'] ?? null, 0, 100000000);
    $name = text($b['name'] ?? '', 200);
    if (!$name) throw new Fehler(400, 'Bitte eine Bezeichnung angeben.');
    $buchung = neue_buchung(['typ' => $typ, 'datum' => datum($b['datum'] ?? ''), 'produktId' => text($b['produktId'] ?? '', 200), 'name' => $name,
        'menge' => $menge, 'einzelpreis' => $einzel, 'betrag' => $menge * $einzel, 'mwst' => $mwst, 'zahlungsart' => text($b['zahlungsart'] ?? '', 40),
        'beleg' => text($b['beleg'] ?? '', 80), 'notiz' => text($b['notiz'] ?? '', 500)], $s['id']);
    antwort(['ok' => true, 'buchung' => $buchung]);
}

function buchung_storno(array $s): never {
    $b = body();
    $id = text($b['id'] ?? '', 40);
    $jahr = text($b['jahr'] ?? '', 4);
    if (!preg_match('/^\d{4}$/', $jahr)) throw new Fehler(404, 'Buchung nicht gefunden.');
    $grund = text($b['grund'] ?? '', 300);
    if (!$grund) throw new Fehler(400, 'Bitte einen Grund für das Storno angeben.');
    $alle = lese_alle("buchungen/$jahr/");
    $orig = null;
    foreach ($alle as $x) if ($x['id'] === $id) $orig = $x;
    if (!$orig || $orig['typ'] === 'storno') throw new Fehler(404, 'Buchung nicht gefunden.');
    foreach ($alle as $x) if ($x['typ'] === 'storno' && ($x['bezug'] ?? '') === $id) throw new Fehler(409, 'Diese Buchung ist schon storniert.');
    $storno = neue_buchung(['typ' => 'storno', 'datum' => substr(jetzt(), 0, 10), 'produktId' => $orig['produktId'], 'name' => $orig['name'], 'menge' => $orig['menge'],
        'einzelpreis' => $orig['einzelpreis'], 'betrag' => $orig['betrag'], 'mwst' => $orig['mwst'], 'zahlungsart' => $orig['zahlungsart'],
        'beleg' => $orig['beleg'], 'notiz' => $grund, 'bezug' => $id], $s['id']);
    antwort(['ok' => true, 'buchung' => $storno]);
}

/* =================== Router =================== */
function zb_api(): never {
    $pfad = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $pfad = rtrim(preg_replace('#^/api#', '', $pfad), '/') ?: '/';
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
    try {
        // Schutz vor fremden Formularen: schreibende Anfragen brauchen unseren Header
        if ($m !== 'GET' && ($_SERVER['HTTP_X_ZB'] ?? '') !== '1') throw new Fehler(403, 'Anfrage abgelehnt.');
        $s = lese_sitzung();

        if ($m === 'POST' && $pfad === '/login') login($ip);
        if ($m === 'POST' && $pfad === '/logout') { sitzung_beenden(); antwort(['ok' => true]); }
        if ($m === 'GET' && $pfad === '/ich') ich($s);
        if ($m === 'POST' && $pfad === '/haendler/registrieren') registrieren($ip);
        if ($m === 'GET' && $pfad === '/shop/daten') shop_daten();
        if ($m === 'POST' && $pfad === '/shop/bestellung') kasse($ip);

        if (str_starts_with($pfad, '/haendler/')) {
            $h = aktiver_haendler($s);
            if ($m === 'GET' && $pfad === '/haendler/preise') {
                $sichtbar = [];
                foreach (preisliste() as $id => $p) if ($p['aktiv']) $sichtbar[$id] = $p;
                antwort(['preise' => obj($sichtbar)]);
            }
            if ($m === 'GET' && $pfad === '/haendler/bestellungen') {
                $eigene = array_values(array_filter(lese_alle('bestellungen/'), fn($b) => $b['haendlerId'] === $h['id']));
                antwort(['bestellungen' => array_reverse($eigene)]);
            }
            if ($m === 'POST' && $pfad === '/haendler/bestellungen') bestellen($h);
            if ($m === 'POST' && $pfad === '/haendler/preisanfrage') preisanfrage($h);
            throw new Fehler(404, 'Nicht gefunden.');
        }

        if (str_starts_with($pfad, '/admin/')) {
            $a = braucht($s, 'admin');
            if ($m === 'GET' && $pfad === '/admin/haendler') antwort(['haendler' => array_reverse(array_map('ohne_pass', lese_alle('haendler/')))]);
            if ($m === 'POST' && $pfad === '/admin/haendler/status') {
                $b = body();
                $hid = text($b['id'] ?? '', 40);
                if (!preg_match('/^H-\d{8}-[0-9A-F]{8}$/', $hid)) throw new Fehler(404, 'Händler nicht gefunden.');
                $h = lese('haendler/' . $hid);
                if (!$h) throw new Fehler(404, 'Händler nicht gefunden.');
                $status = $b['status'] ?? '';
                if (!in_array($status, ['offen', 'aktiv', 'gesperrt'], true)) throw new Fehler(400, 'Unbekannter Status.');
                $h['status'] = $status; $h['geaendert'] = jetzt();
                if (is_string($b['notiz'] ?? null)) $h['notiz'] = text($b['notiz'], 500);
                schreibe('haendler/' . $h['id'], $h);
                protokoll('haendler-status', $a['id'], ['haendler' => $h['id'], 'status' => $status]);
                antwort(['ok' => true, 'haendler' => ohne_pass($h)]);
            }
            if ($m === 'GET' && $pfad === '/admin/preise') antwort(['preise' => obj(preisliste()), 'shop' => obj(shop_preise()), 'einstellungen' => einstellungen()]);
            if ($m === 'POST' && $pfad === '/admin/shoppreise') shop_preise_speichern($a);
            if ($m === 'POST' && $pfad === '/admin/einstellungen') einstellungen_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/pakete') antwort(['pakete' => pakete()]);
            if ($m === 'POST' && $pfad === '/admin/pakete') pakete_speichern($a);
            if ($m === 'POST' && $pfad === '/admin/preise') preise_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/bestellungen') antwort(['bestellungen' => array_reverse(lese_alle('bestellungen/'))]);
            if ($m === 'POST' && $pfad === '/admin/bestellungen/status') bestell_status($a);
            if ($m === 'POST' && $pfad === '/admin/bestellungen/buchen') bestellung_buchen($a);
            if ($m === 'GET' && $pfad === '/admin/buchungen') {
                $wunsch = (string) ($_GET['jahr'] ?? '');
                if ($wunsch === 'alle') antwort(['jahr' => 'alle', 'buchungen' => lese_alle('buchungen/')]);
                $jahr = preg_match('/^\d{4}$/', $wunsch) ? $wunsch : gmdate('Y');
                antwort(['jahr' => $jahr, 'buchungen' => lese_alle("buchungen/$jahr/")]);
            }
            if ($m === 'POST' && $pfad === '/admin/buchungen') buchung_anlegen($a);
            if ($m === 'POST' && $pfad === '/admin/buchungen/storno') buchung_storno($a);
            if ($m === 'GET' && $pfad === '/admin/protokoll') {
                $monat = preg_match('/^\d{4}-\d{2}$/', (string) ($_GET['monat'] ?? '')) ? $_GET['monat'] : substr(jetzt(), 0, 7);
                antwort(['protokoll' => array_slice(array_reverse(lese_alle("protokoll/$monat/")), 0, 500)]);
            }
            throw new Fehler(404, 'Nicht gefunden.');
        }
        throw new Fehler(404, 'Nicht gefunden.');
    } catch (Fehler $e) {
        antwort(['fehler' => $e->getMessage()], $e->status);
    } catch (Throwable $e) {
        error_log('ZUKKABRO API: ' . $e->getMessage());
        antwort(['fehler' => 'Serverfehler. Bitte später erneut versuchen.'], 500);
    }
}
