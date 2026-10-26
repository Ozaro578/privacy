<?php
// HTML-Mails im ZUKKABRO-Look (Spiegel von netlify/functions/api/mailvorlagen.mts)
declare(strict_types=1);
const MV_SEITE = 'https://zukkabro.de';
const MV_F = ['pink' => '#ff2e98', 'pinkDeep' => '#c0005a', 'gold' => '#e6ab35', 'goldSoft' => '#fff0c2', 'cream' => '#fbf1e6', 'paper' => '#fffaf3', 'choco' => '#2b140a', 'green' => '#5fc46a'];
const MV_SCHRIFT = "'Fredoka','Segoe UI',Arial,Helvetica,sans-serif";
function mv_esc(mixed $s): string { return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES, 'UTF-8'); }
function mv_euro(int $cent): string { return number_format($cent / 100, 2, ',', '.') . ' €'; }
function mv_rahmen(string $titel, string $untertitel, string $inhalt, string $farbe = MV_F['pink']): string {
    $F = MV_F; $S = MV_SCHRIFT; $W = MV_SEITE;
    $ut = $untertitel !== '' ? "<div style=\"font-family:$S;font-size:15px;line-height:1.4;color:#ffffff;opacity:.92;padding-top:6px;\">" . mv_esc($untertitel) . '</div>' : '';
    return "<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>" . mv_esc($titel) . "</title></head>
<body style=\"margin:0;padding:0;background:{$F['cream']};\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:{$F['cream']};\"><tr><td align=\"center\" style=\"padding:24px 12px;\">
<table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;width:100%;\">
<tr><td align=\"center\" style=\"padding:8px 0 18px;\"><a href=\"$W\" style=\"text-decoration:none;\"><img src=\"$W/assets/img/logo.png\" width=\"220\" alt=\"ZUKKABRO\" style=\"display:block;width:220px;max-width:70%;height:auto;border:0;\"></a></td></tr>
<tr><td style=\"background:$farbe;border:4px solid {$F['choco']};border-radius:22px 22px 0 0;padding:22px 26px;\"><div style=\"font-family:$S;font-size:26px;line-height:1.15;font-weight:800;color:#ffffff;\">" . mv_esc($titel) . "</div>$ut</td></tr>
<tr><td style=\"background:{$F['paper']};border:4px solid {$F['choco']};border-top:0;border-radius:0 0 22px 22px;padding:24px 26px;font-family:$S;font-size:15px;line-height:1.55;color:{$F['choco']};\">$inhalt</td></tr>
<tr><td style=\"padding:22px 10px 0;font-family:$S;font-size:12px;line-height:1.6;color:#6b4b3a;text-align:center;\"><strong style=\"color:{$F['choco']};\">ZUKKABRO</strong> · Klingenberger Straße 100 · 74080 Heilbronn<br><a href=\"tel:+4971315912230\" style=\"color:{$F['pinkDeep']};text-decoration:none;\">07131 5912230</a> · <a href=\"mailto:info@zukkabro.de\" style=\"color:{$F['pinkDeep']};text-decoration:none;\">info@zukkabro.de</a> · <a href=\"$W\" style=\"color:{$F['pinkDeep']};text-decoration:none;\">zukkabro.de</a><br><a href=\"https://www.instagram.com/zukkabro.de/\" style=\"color:{$F['pinkDeep']};text-decoration:none;\">Instagram</a> · <a href=\"https://www.tiktok.com/@zukkabro.de\" style=\"color:{$F['pinkDeep']};text-decoration:none;\">TikTok</a> · <a href=\"https://www.facebook.com/profile.php?id=61594963992185\" style=\"color:{$F['pinkDeep']};text-decoration:none;\">Facebook</a><br><a href=\"$W/rechtliches.html\" style=\"color:#6b4b3a;\">Impressum &amp; Datenschutz</a></td></tr>
</table></td></tr></table></body></html>";
}
function mv_knopf(string $text, string $url, string $farbe = MV_F['pink']): string {
    return "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:16px 0;\"><tr><td style=\"background:$farbe;border:3px solid " . MV_F['choco'] . ";border-radius:999px;\"><a href=\"" . mv_esc($url) . "\" style=\"display:inline-block;padding:11px 22px;font-family:" . MV_SCHRIFT . ";font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;\">" . mv_esc($text) . '</a></td></tr></table>';
}
function mv_kasten(string $inhalt, string $hintergrund = MV_F['goldSoft']): string {
    return "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:14px 0;\"><tr><td style=\"background:$hintergrund;border:2px solid " . MV_F['choco'] . ";border-radius:14px;padding:12px 16px;font-family:" . MV_SCHRIFT . ";font-size:14px;line-height:1.5;color:" . MV_F['choco'] . ";\">$inhalt</td></tr></table>";
}
function mv_tabelle(array $b): string {
    $S = MV_SCHRIFT; $C = MV_F['choco']; $z = '';
    foreach ($b['positionen'] as $i => $p) { $bt = $i === 0 ? 'border-top:0;' : ''; $z .= "<tr><td style=\"padding:9px 6px;border-top:1px solid #e9dccd;font-family:$S;font-size:14px;color:$C;$bt\"><strong>{$p['stueck']} ×</strong> " . mv_esc($p['name']) . "</td><td align=\"right\" style=\"padding:9px 6px;border-top:1px solid #e9dccd;font-family:$S;font-size:14px;color:$C;white-space:nowrap;$bt\">" . mv_euro((int) ($p['brutto'] ?? 0)) . '</td></tr>'; }
    $versand = (int) ($b['versand'] ?? 0);
    if ($versand) $z .= "<tr><td style=\"padding:9px 6px;border-top:2px solid $C;font-family:$S;font-size:14px;color:$C;\">" . (($b['lieferart'] ?? '') === 'kurier' ? 'Lieferung Heilbronn' : 'Versand') . "</td><td align=\"right\" style=\"padding:9px 6px;border-top:2px solid $C;font-family:$S;font-size:14px;color:$C;\">" . mv_euro($versand) . '</td></tr>';
    $bt = $versand ? '1px solid #e9dccd' : "2px solid $C";
    return "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:10px 0;background:#ffffff;border:2px solid $C;border-radius:14px;\"><tr><td style=\"padding:6px 10px 0;\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">$z<tr><td style=\"padding:12px 6px;border-top:$bt;font-family:$S;font-size:17px;font-weight:800;color:$C;\">Gesamt</td><td align=\"right\" style=\"padding:12px 6px;border-top:$bt;font-family:$S;font-size:20px;font-weight:800;color:" . MV_F['pink'] . ";white-space:nowrap;\">" . mv_euro((int) $b['brutto']) . "</td></tr></table><div style=\"padding:0 6px 8px;font-family:$S;font-size:12px;color:#6b4b3a;\">inkl. MwSt.</div></td></tr></table>";
}
function mv_lieferblock(array $b, string $abholort): string {
    $k = $b['kunde'];
    if (($b['lieferart'] ?? '') === 'abholung') return '<strong>📍 Abholung</strong><br>' . mv_esc($abholort ?: 'ZUKKABRO, Klingenberger Straße 100, 74080 Heilbronn') . '<br>Wir sagen dir per E-Mail Bescheid, sobald deine Bestellung abholbereit ist.';
    return '<strong>' . (($b['lieferart'] ?? '') === 'kurier' ? '🛵 Lieferung per Kurier in Heilbronn' : '🚚 Versand an') . '</strong><br>' . mv_esc($k['vorname']) . ' ' . mv_esc($k['nachname']) . '<br>' . mv_esc($k['strasse']) . '<br>' . mv_esc($k['plz']) . ' ' . mv_esc($k['ort']);
}
function mv_auftrag(array $b, array $info, string $hinweis): string {
    $P = MV_F['pinkDeep'];
    $zahlung = match ($info['art'] ?? '') {
        'ueberweisung' => '<strong>💳 Überweisung (Vorkasse)</strong><br>Bitte überweise <strong>' . mv_euro((int) $b['brutto']) . '</strong> an:<br>' . mv_esc($info['inhaber'] ?: 'ZUKKABRO') . '<br>IBAN: <strong>' . mv_esc($info['iban'] ?: '(folgt per E-Mail)') . '</strong>' . (!empty($info['bank']) ? '<br>Bank: ' . mv_esc($info['bank']) : '') . '<br>Verwendungszweck: <strong>' . mv_esc($b['id']) . '</strong>',
        'paypal' => '<strong>💙 PayPal</strong><br>Bitte zahle <strong>' . mv_euro((int) $b['brutto']) . '</strong> an <strong>' . mv_esc($info['ziel'] ?? '') . '</strong><br>Verwendungszweck: <strong>' . mv_esc($b['id']) . '</strong>',
        'stripe' => '<strong>✅ Online bezahlt</strong><br>Deine Zahlung läuft über Stripe, die Zahlungsbestätigung bekommst du separat.',
        default => '<strong>💵 Bar bei Abholung</strong><br>Du zahlst <strong>' . mv_euro((int) $b['brutto']) . '</strong> bei der Abholung' . (!empty($info['abholort']) ? ' (' . mv_esc($info['abholort']) . ')' : '') . '.',
    };
    $inhalt = '<p style="margin:0 0 6px;font-size:17px;">Hey ' . mv_esc($b['kunde']['vorname']) . ', 👋</p><p style="margin:0 0 14px;">danke für deine Bestellung bei ZUKKABRO! Hier ist deine Auftragsbestätigung. Deine Bestellnummer: <strong style="color:' . $P . ';">' . mv_esc($b['id']) . '</strong></p>'
        . mv_tabelle($b) . mv_kasten(mv_lieferblock($b, (string) ($info['abholort'] ?? ''))) . mv_kasten($zahlung, '#ffffff')
        . (!empty($b['ab18']) ? mv_kasten('🔞 <strong>Artikel ab 18 dabei.</strong> Bitte halte bei der Übergabe deinen Ausweis bereit.', '#ffe3ef') : '')
        . ($hinweis !== '' ? '<p style="margin:14px 0 0;">' . nl2br(mv_esc($hinweis)) . '</p>' : '')
        . mv_knopf('Weiter stöbern auf zukkabro.de', MV_SEITE . '/sortiment.html')
        . '<p style="margin:12px 0 0;">Fragen? Antworte einfach auf diese Mail oder ruf an: <a href="tel:+4971315912230" style="color:' . $P . ';font-weight:700;text-decoration:none;">07131 5912230</a>.</p><p style="margin:14px 0 0;font-weight:800;">Bis bald,<br>dein ZUKKABRO-Team 👑</p>';
    return mv_rahmen('Deine Bestellung ist da! 🎉', 'Auftragsbestätigung ' . $b['id'], $inhalt, MV_F['pink']);
}
const MV_DIENSTE = ['dhl' => ['DHL', 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode='], 'hermes' => ['Hermes', 'https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#'], 'dpd' => ['DPD', 'https://tracking.dpd.de/parcelstatus?query='], 'gls' => ['GLS', 'https://gls-group.eu/DE/de/paketverfolgung?match='], 'ups' => ['UPS', 'https://www.ups.com/track?loc=de_DE&tracknum='], 'post' => ['Deutsche Post', 'https://www.deutschepost.de/de/s/sendungsverfolgung.html?piececode=']];
function mv_versand(array $b, string $dienst, string $nummer): array {
    $d = MV_DIENSTE[$dienst] ?? null; $kurier = ($b['lieferart'] ?? '') === 'kurier';
    $track = $nummer !== '' ? '<strong>' . mv_esc($d ? $d[0] : ($dienst ?: 'Paketdienst')) . '</strong> · Sendungsnummer <strong>' . mv_esc($nummer) . '</strong>' . ($d ? mv_knopf('📦 Sendung verfolgen', $d[1] . rawurlencode($nummer), MV_F['gold']) : '')
        : ($kurier ? 'Unser Kurier ist unterwegs zu dir in Heilbronn.' : 'Dein Paket ist unterwegs' . ($d ? ' mit ' . mv_esc($d[0]) : '') . '.');
    $inhalt = '<p style="margin:0 0 6px;font-size:17px;">Hey ' . mv_esc($b['kunde']['vorname']) . ', 🚀</p><p style="margin:0 0 14px;">deine Bestellung <strong style="color:' . MV_F['pinkDeep'] . ';">' . mv_esc($b['id']) . '</strong> hat unser Lager verlassen und ist auf dem Weg zu dir!</p>'
        . mv_kasten($track) . mv_kasten(mv_lieferblock($b, ''), '#ffffff') . mv_tabelle($b)
        . (!empty($b['ab18']) ? mv_kasten('🔞 <strong>Artikel ab 18 dabei.</strong> Bitte halte bei der Übergabe deinen Ausweis bereit.', '#ffe3ef') : '')
        . '<p style="margin:12px 0 0;">Wir wünschen dir viel Spaß beim Snacken! Wenn etwas nicht passt, antworte einfach auf diese Mail.</p><p style="margin:14px 0 0;font-weight:800;">Dein ZUKKABRO-Team 👑</p>';
    $text = "Hey {$b['kunde']['vorname']},\n\ndeine Bestellung {$b['id']} ist unterwegs!\n" . ($nummer !== '' ? ($d ? $d[0] : $dienst) . ": Sendungsnummer $nummer" . ($d ? "\nVerfolgen: " . $d[1] . rawurlencode($nummer) : '') . "\n" : '') . "\nViel Spaß beim Snacken!\ndein ZUKKABRO-Team\n" . MV_SEITE;
    return ['html' => mv_rahmen($kurier ? 'Dein Kurier ist unterwegs! 🛵' : 'Deine Ware ist raus! 📦', 'Versandbestätigung ' . $b['id'], $inhalt, MV_F['green']), 'text' => $text, 'betreff' => ($kurier ? 'Dein Kurier ist unterwegs' : 'Deine Bestellung ist unterwegs') . ': ' . $b['id']];
}
function mv_abholbereit(array $b, string $abholort): array {
    $ort = $abholort ?: 'ZUKKABRO, Klingenberger Straße 100, 74080 Heilbronn';
    $inhalt = '<p style="margin:0 0 6px;font-size:17px;">Hey ' . mv_esc($b['kunde']['vorname']) . ', 🛍️</p><p style="margin:0 0 14px;">deine Bestellung <strong style="color:' . MV_F['pinkDeep'] . ';">' . mv_esc($b['id']) . '</strong> liegt für dich bereit!</p>'
        . mv_kasten('<strong>📍 Abholen bei</strong><br>' . mv_esc($ort) . '<br>Einfach Bestellnummer nennen oder diese Mail zeigen.') . mv_tabelle($b)
        . (!empty($b['ab18']) ? mv_kasten('🔞 <strong>Artikel ab 18 dabei.</strong> Bitte Ausweis mitbringen.', '#ffe3ef') : '')
        . '<p style="margin:14px 0 0;font-weight:800;">Bis gleich,<br>dein ZUKKABRO-Team 👑</p>';
    return ['html' => mv_rahmen('Abholbereit! 🛍️', 'Bestellung ' . $b['id'], $inhalt, MV_F['gold']), 'text' => "Hey {$b['kunde']['vorname']},\n\ndeine Bestellung {$b['id']} liegt zur Abholung bereit: $ort.\nBestellnummer nennen oder diese Mail zeigen.\n\ndein ZUKKABRO-Team\n" . MV_SEITE, 'betreff' => 'Abholbereit: Bestellung ' . $b['id']];
}
