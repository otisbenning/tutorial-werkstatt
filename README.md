# Tutorial-Werkstatt - Start with a Friend

Eine browserbasierte Anwendung zum Erstellen und Teilen interaktiver Web-Tutorials als Bookmarklets.

## Features

- **Aufnahme**: Zeichne Klicks, Eingaben und Drag & Drop auf beliebigen Webseiten auf
- **Editor**: Bearbeite Schritte, füge Beschreibungen hinzu, definiere Einstiegspunkte
- **Bookmarklet-Generator**: Erstelle eigenständige Bookmarklets, die Nutzer in ihre Lesezeichenleiste ziehen können
- **Cross-Site Navigation**: Tutorials funktionieren über mehrere Webseiten hinweg
- **Lokale Aktionen**: Unterstützung für Schritte außerhalb des Browsers (z.B. Download-Ordner öffnen)
- **Import/Export**: Tutorials als JSON speichern und teilen

## Schnellstart

1. Öffne `index.html` in deinem Browser
2. Ziehe "Aufnahme starten" in deine Lesezeichenleiste
3. Gehe zur Webseite, für die du ein Tutorial erstellen möchtest
4. Klicke auf das Lesezeichen um die Aufnahme zu starten
5. Führe die Schritte durch und beschreibe jeden Klick
6. Beende die Aufnahme - die Daten werden automatisch importiert
7. Bearbeite das Tutorial im Editor
8. Ziehe das generierte Tutorial-Bookmarklet in die Lesezeichenleiste

## Dateistruktur

```
Interaktives Lernen/
├── index.html          # Hauptanwendung (Editor & Generator)
├── styles.css          # Styling
├── app.js              # Editor-Logik
├── recorder.js         # Aufnahme-Script
├── player.js           # Abspielen-Script (Referenz)
├── tutorials/          # Beispiel-Tutorials
│   └── beispiel.json
└── README.md
```

## Verwendung

### Tutorial aufnehmen

1. **Aufnahme starten**: Klicke auf das "Aufnahme starten" Bookmarklet auf der gewünschten Webseite
2. **Elemente aufnehmen**: Klicke auf die Elemente, die du im Tutorial zeigen möchtest
3. **Beschreibungen hinzufügen**: Nach jedem Klick wirst du gefragt, was der Nutzer tun soll
4. **Manuelle Schritte**: Klicke auf "+ Manuell" für Aktionen außerhalb des Browsers
5. **Aufnahme beenden**: Klicke auf "Fertig" und gib dem Tutorial einen Namen

### Tutorial bearbeiten

- **Schritte umsortieren**: Per Drag & Drop oder mit den Pfeiltasten
- **Beschreibungen ändern**: Klicke auf das Stift-Symbol
- **Einstiegspunkte setzen**: Markiere Schritte, bei denen Nutzer einsteigen können
- **Optionale Schritte**: Markiere Schritte, die übersprungen werden können

### Tutorial teilen

1. **Als Bookmarklet**: Ziehe das generierte Bookmarklet in die Lesezeichenleiste
2. **Als JSON exportieren**: Klicke auf "Als JSON exportieren" zum Teilen
3. **Auf GitHub hosten**: Lade die JSON-Datei in den `tutorials/` Ordner hoch

## Tutorial-Datenstruktur

```json
{
  "id": "eindeutige-id",
  "name": "Tutorial-Name",
  "description": "Beschreibung des Tutorials",
  "startUrl": "https://example.com",
  "steps": [
    {
      "type": "click",
      "selector": "#button-id",
      "xpath": "//button[@id='button-id']",
      "url": "https://example.com/page",
      "description": "Klicke auf diesen Button",
      "optional": false,
      "isEntryPoint": true
    }
  ]
}
```

### Schritt-Typen

| Typ | Beschreibung |
|-----|--------------|
| `click` | Klick auf ein Element |
| `input` | Texteingabe in ein Feld |
| `navigate` | Navigation zu einer URL |
| `drag` | Drag & Drop Aktion |
| `local_action` | Aktion außerhalb des Browsers |
| `wait` | Warten auf Nutzeraktion |

## Hosting auf GitHub Pages

1. Erstelle ein GitHub Repository
2. Lade alle Dateien hoch
3. Aktiviere GitHub Pages in den Repository-Einstellungen
4. Deine Tutorials sind nun unter `https://username.github.io/repo-name/` erreichbar

## Browser-Kompatibilität

- Chrome (empfohlen)
- Firefox
- Edge
- Safari

## Bekannte Einschränkungen

- Bookmarklets funktionieren nicht auf Seiten mit strikter Content Security Policy
- Einige Webseiten blockieren das Injizieren von Scripts
- Sehr lange Tutorials können die Bookmarklet-Größe überschreiten (max. ~2000 Zeichen in der URL)

## Lizenz

MIT License - Frei verwendbar für private und kommerzielle Zwecke.

---

Erstellt mit Freude zum Lernen und Lehren.
