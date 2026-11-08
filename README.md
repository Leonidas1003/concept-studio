# Concept Studio 1.2 – Supabase Cloud

Dies ist die **Cloud-Testversion** der bestehenden Concept-Studio-Oberfläche. Sie verwendet keine lokale Projektdatenbank. Benutzer-Sessions werden vom Supabase-Auth-SDK im Browser gespeichert, nicht die Projekte.

## Voraussetzungen

- Eigenes Supabase-Projekt `concept-studio`
- SQL aus Schritt 3 (Tabellen) und Schritt 4 (RLS, Adminprofil)
- SQL aus Schritt 5 (vier private Storage-Buckets)
- Bestätigtes, aktives Benutzerkonto in `cs_profiles`
- Online-Webhosting über HTTPS (z. B. GitHub Pages). Zum lokalen Funktionstest reicht ein statischer Webserver; `file://` wird nicht empfohlen.

## Einrichtung

1. Öffne `supabase-config.js` und trage `url` und `publishableKey` ein. Nur den öffentlichen Publishable Key (`sb_publishable_...`) bzw. Legacy `anon` Key verwenden, **niemals** `service_role`, `sb_secret_...`, JWT-Secret oder Datenbankpasswort.
2. In Supabase unter **Authentication → URL Configuration** die tatsächliche Webadresse als **Site URL** und gegebenenfalls als Redirect URL konfigurieren. Einladungs- und Passwortlinks müssen zur App zurückführen.
3. Lade den kompletten Ordner inklusive `vendor`, `assets`, `cloud.js` und `supabase-config.js` auf das Webhosting hoch.
4. Lade die Seite, melde dich mit deinem eingeladenen Firmenkonto an. Nach einer Einladung kannst du über den Einladungslink und die Funktion **Passwort nach Einladung festlegen** dein Passwort setzen.
5. Prüfe mit einem **Testprojekt**: Projekt anlegen → Geschoss → Grundriss/Bild → Raum → Konzeptbild → Konzepttext → Reload. Überprüfe im Supabase Dashboard `cs_projects`, `cs_floors`, `cs_rooms`, `cs_concept_pages`, `cs_library_items` und die privaten Buckets.

## Speichermodell

- **Autoritativ:** `cs_projects.settings.app_snapshot` enthält das vollständige editierbare Projekt (außer Datei-Bytes); dadurch bleiben die bisherigen umfangreichen Editor-Felder erhalten.
- **Relationale Projektion:** `cs_floors`, `cs_rooms`, `cs_concept_pages` werden zusätzlich gepflegt. Die Seiten-Elemente sind in `cs_concept_pages.settings.editor_elements` enthalten. Die Tabelle `cs_page_elements` wird in dieser Übergangsversion noch **nicht** einzeln synchronisiert.
- **Dateien:** Neue eingebettete Bilddateien werden vor dem Speichern in die privaten Buckets hochgeladen. In der Datenbank stehen Storage-Pfade, nicht Base64-Dateien. Beim Öffnen werden zeitlich begrenzte signierte URLs erzeugt.
- **Bibliothek:** `cs_library_items.metadata.app_snapshot` plus Bild-/Datenblattdateien in Storage.
- **Löschen:** Projekt- und Bibliotheksdatensätze werden aus der Datenbank entfernt. Bereits hochgeladene Storage-Dateien bleiben zunächst erhalten und müssen später über einen gesicherten Aufräumprozess entfernt werden. Das schützt vor versehentlichem Datenverlust, benötigt aber Speicherplatz.
- **Kommentare/Revisionen:** Bleiben vollständig im Projektsnapshot erhalten; `cs_comments` und `cs_revisions` werden noch nicht einzeln synchronisiert.

## Bekannte Einschränkungen (vor Produktivfreigabe beheben)

- **Keine parallele Konfliktauflösung:** Gleichzeitiges Bearbeiten desselben Projekts in mehreren Browsern kann zu Überschreibungen führen. Ein Projekt daher vorerst nur von einer Person gleichzeitig bearbeiten.
- **Keine transaktionale Speicherung:** Snapshot, relationale Tabellen und Dateien werden in mehreren Schritten gespeichert. Bei Fehlern kann der letzte Stand unvollständig sein; Fehlermeldung beachten und erneut speichern.
- **Signed URLs** gelten aktuell eine Stunde; nach längerer Bearbeitung die App neu laden, wenn Bilder nicht mehr angezeigt werden.
- **Projektschema-Migration:** Vorhandene lokale/alte JSON-Projekte werden nicht automatisch importiert. Export-/Importformat und UUID-Zuordnung müssen für eine Migration separat getestet werden.
- **PDF/PPTX-Export** und Editor sind aus 1.1 übernommen, nicht neu auf Pixelgleichheit geprüft.
- **Storage-Größenlimits** hängen zusätzlich vom Supabase-Tarif ab.
- **Sicherheit:** RLS und Storage-Policies aus Schritt 4/5 sind Voraussetzung. Teste explizit `anon`, aktive Mitglieder und gesperrte Mitglieder. Der Browser darf ausschließlich einen öffentlichen API-Key enthalten.
- **Noch nicht produktionsreif** für vertrauliche Kundenprojekte ohne weitere Tests, Backup-/Restore-Konzept und Konfliktschutz.

## Testen ohne GitHub

In einem Terminal im Ordner `concept-studio-1.2`:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Für Einladungslinks muss diese Adresse in Supabase als erlaubte Redirect URL eingetragen sein. Python dient nur zum Ausliefern der Dateien; es speichert keine Projekte.

## Dateien

- `index.html`: bisherige Oberfläche
- `cloud.js`: Supabase Login, Laden, Speichern, Storage-Uploads
- `supabase-config.js`: öffentliche Projektkonfiguration
- `assets/`: Logo
- `vendor/`: PDF/PowerPoint-/ZIP-Hilfsbibliotheken
