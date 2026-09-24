<?php
// ZUKKABRO – Datenspeicher in JSON-Dateien (ersetzt Netlify Blobs).
// Schlüssel wie "haendler/H-123" werden zu Dateien DATEN/haendler/H-123.json.
declare(strict_types=1);

function zb_pfad(string $key): string {
    $key = str_replace('\\', '/', $key);
    if ($key === '' || str_contains($key, '..') || !preg_match('#^[A-Za-z0-9/_.:+-]+$#', $key)) {
        throw new RuntimeException('Ungültiger Schlüssel');
    }
    return ZB_DATEN . '/' . $key . '.json';
}

function lese(string $key): mixed {
    $f = zb_pfad($key);
    if (!is_file($f)) return null;
    $h = fopen($f, 'rb');
    if (!$h) return null;
    flock($h, LOCK_SH);
    $inhalt = stream_get_contents($h);
    flock($h, LOCK_UN);
    fclose($h);
    return $inhalt === false || $inhalt === '' ? null : json_decode($inhalt, true);
}

function schreibe(string $key, mixed $wert): void {
    $f = zb_pfad($key);
    $dir = dirname($f);
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) throw new RuntimeException('Speicher nicht beschreibbar');
    $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, json_encode($wert, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) {
        throw new RuntimeException('Speichern fehlgeschlagen');
    }
    rename($tmp, $f); // atomar
}

/** Alle Einträge mit Präfix (sortiert nach Schlüssel) */
function lese_alle(string $prefix): array {
    $basis = ZB_DATEN . '/' . rtrim($prefix, '/');
    if (!is_dir($basis)) return [];
    $dateien = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($basis, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $datei) {
        if ($datei->isFile() && str_ends_with($datei->getFilename(), '.json')) $dateien[] = $datei->getPathname();
    }
    sort($dateien, SORT_STRING);
    $out = [];
    foreach ($dateien as $f) {
        $d = json_decode((string) file_get_contents($f), true);
        if ($d !== null) $out[] = $d;
    }
    return $out;
}
