/**
 * Tutorial-Werkstatt - Recorder (Screenreader-Ansatz)
 * Nimmt Benutzerinteraktionen auf einer Webseite auf
 *
 * Vereinfachter Ansatz: Statt komplexer Selektoren wird der
 * "Accessible Name" (wie ein Screenreader ihn lesen würde) gespeichert.
 */

(function() {
    'use strict';

    // ==========================================
    // Session Storage Keys für Persistenz
    // ==========================================

    const STORAGE_KEYS = {
        RECORDER_ACTIVE: 'swf_recorder_active',
        RECORDER_STATE: 'swf_recorder_state',
        RECORDER_CONFIG: 'swf_recorder_config'
    };

    // Verhindern dass Recorder mehrfach geladen wird
    if (window._swfRecorder) {
        console.log('SWF Recorder bereits aktiv');
        return;
    }

    window._swfRecorder = true;

    // ==========================================
    // Konfiguration & Zustand
    // ==========================================

    const config = {
        recordingMode: 'manual',
        triggerKey: 'Alt',
        triggerKeyDisplay: 'Alt + Klick',
    };

    const state = {
        recording: false,
        paused: false,
        steps: [],
        startUrl: window.location.href,
        currentUrl: window.location.href,
        triggerKeyPressed: false,
    };

    // ==========================================
    // Persistenz-Funktionen
    // ==========================================

    function saveStateToStorage() {
        if (!state.recording) return;
        try {
            const stateToSave = {
                recording: state.recording,
                paused: state.paused,
                steps: state.steps,
                startUrl: state.startUrl,
                currentUrl: window.location.href,
                timestamp: Date.now()
            };
            sessionStorage.setItem(STORAGE_KEYS.RECORDER_STATE, JSON.stringify(stateToSave));
            sessionStorage.setItem(STORAGE_KEYS.RECORDER_CONFIG, JSON.stringify(config));
            sessionStorage.setItem(STORAGE_KEYS.RECORDER_ACTIVE, 'true');
        } catch (e) {
            console.error('SWF: Fehler beim Speichern:', e);
        }
    }

    function loadStateFromStorage() {
        try {
            const stateJson = sessionStorage.getItem(STORAGE_KEYS.RECORDER_STATE);
            const configJson = sessionStorage.getItem(STORAGE_KEYS.RECORDER_CONFIG);

            if (stateJson) {
                const savedState = JSON.parse(stateJson);
                // Prüfe ob Session nicht zu alt ist (30 Minuten)
                if (savedState.timestamp && Date.now() - savedState.timestamp < 30 * 60 * 1000) {
                    Object.assign(state, savedState);
                    state.currentUrl = window.location.href;

                    // Navigation-Schritt hinzufügen wenn URL gewechselt
                    if (savedState.currentUrl && savedState.currentUrl !== window.location.href) {
                        state.steps.push({
                            type: 'navigate',
                            url: window.location.href,
                            description: 'Seite wurde gewechselt',
                            isEntryPoint: true
                        });
                    }
                }
            }

            if (configJson) {
                Object.assign(config, JSON.parse(configJson));
            }

            return stateJson !== null;
        } catch (e) {
            console.error('SWF: Fehler beim Laden:', e);
            return false;
        }
    }

    function clearStorage() {
        try {
            sessionStorage.removeItem(STORAGE_KEYS.RECORDER_ACTIVE);
            sessionStorage.removeItem(STORAGE_KEYS.RECORDER_STATE);
            sessionStorage.removeItem(STORAGE_KEYS.RECORDER_CONFIG);
        } catch (e) {
            console.error('SWF: Fehler beim Leeren:', e);
        }
    }

    // ==========================================
    // CSS Styles
    // ==========================================

    const styles = `
        #swf-recorder-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            min-width: 280px;
            cursor: move;
            user-select: none;
        }

        #swf-recorder-panel.paused {
            background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
        }

        .swf-recorder-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .swf-recorder-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }

        .swf-recorder-dot {
            width: 12px;
            height: 12px;
            background: #ff4444;
            border-radius: 50%;
            animation: swf-blink 1s infinite;
        }

        .paused .swf-recorder-dot {
            background: #ffcc00;
            animation: none;
        }

        @keyframes swf-blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }

        @keyframes swf-toast-in {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes swf-highlight-pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }

        .swf-recorder-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .swf-recorder-close:hover {
            background: rgba(255,255,255,0.3);
        }

        .swf-recorder-stats {
            background: rgba(0,0,0,0.2);
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 13px;
        }

        .swf-recorder-buttons {
            display: flex;
            gap: 8px;
        }

        .swf-recorder-btn {
            flex: 1;
            padding: 10px 12px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: background 0.2s, transform 0.1s;
        }

        .swf-recorder-btn:hover {
            transform: translateY(-1px);
        }

        .swf-recorder-btn-pause {
            background: rgba(255,255,255,0.2);
            color: white;
        }

        .swf-recorder-btn-manual {
            background: rgba(255,255,255,0.2);
            color: white;
        }

        .swf-recorder-btn-stop {
            background: white;
            color: #2e7d32;
        }

        /* Popup für Beschreibung */
        #swf-description-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 24px;
            z-index: 2147483647;
            min-width: 400px;
            max-width: 500px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #swf-description-popup h3 {
            color: #2e7d32;
            margin: 0 0 8px 0;
            font-size: 18px;
        }

        #swf-description-popup .popup-info {
            color: #666;
            font-size: 13px;
            margin-bottom: 16px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 6px;
        }

        #swf-description-popup .popup-info strong {
            color: #2e7d32;
        }

        #swf-description-popup textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 15px;
            font-family: inherit;
            resize: vertical;
            min-height: 80px;
            margin-bottom: 16px;
            box-sizing: border-box;
        }

        #swf-description-popup textarea:focus {
            outline: none;
            border-color: #2e7d32;
        }

        #swf-description-popup .popup-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        #swf-description-popup button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }

        #swf-description-popup .btn-save {
            background: #2e7d32;
            color: white;
        }

        #swf-description-popup .btn-skip {
            background: #f5f5f5;
            color: #333;
        }

        /* Manual Step Popup */
        #swf-manual-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 24px;
            z-index: 2147483647;
            min-width: 400px;
            max-width: 500px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #swf-manual-popup h3 {
            color: #5d4037;
            margin: 0 0 16px 0;
            font-size: 18px;
        }

        #swf-manual-popup label {
            display: block;
            font-weight: 500;
            margin-bottom: 6px;
            color: #333;
        }

        #swf-manual-popup input,
        #swf-manual-popup textarea,
        #swf-manual-popup select {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            margin-bottom: 16px;
            box-sizing: border-box;
        }

        #swf-manual-popup textarea {
            min-height: 80px;
            resize: vertical;
        }

        #swf-manual-popup .popup-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        #swf-manual-popup button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }

        #swf-manual-popup .btn-add {
            background: #5d4037;
            color: white;
        }

        #swf-manual-popup .btn-cancel {
            background: #f5f5f5;
            color: #333;
        }

        .swf-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2147483646;
        }

        .swf-recorded-element {
            outline: 3px solid #4caf50 !important;
            outline-offset: 2px;
        }

        .swf-hover-highlight {
            outline: 2px dashed #2196f3 !important;
            outline-offset: 2px;
        }
    `;

    // ==========================================
    // SCREENREADER-ANSATZ: Accessible Name berechnen
    // ==========================================

    /**
     * Berechnet den "accessible name" eines Elements -
     * den Text, den ein Screenreader vorlesen würde.
     */
    function getAccessibleName(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';

        // 1. aria-label hat höchste Priorität
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel.trim();

        // 2. aria-labelledby
        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
            const parts = labelledBy.split(/\s+/).map(id => {
                const labelEl = document.getElementById(id);
                return labelEl ? labelEl.textContent.trim() : '';
            }).filter(Boolean);
            if (parts.length > 0) return parts.join(' ');
        }

        // 3. Für Input-Elemente: zugehöriges Label
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
            // Label mit for-Attribut
            if (el.id) {
                const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
                if (label) return label.textContent.trim();
            }
            // Umschließendes Label
            const parentLabel = el.closest('label');
            if (parentLabel) {
                const clone = parentLabel.cloneNode(true);
                clone.querySelectorAll('input, select, textarea').forEach(i => i.remove());
                const text = clone.textContent.trim();
                if (text) return text;
            }
            // Placeholder als Fallback
            const placeholder = el.getAttribute('placeholder');
            if (placeholder) return placeholder.trim();
            // name-Attribut als letzter Fallback
            const name = el.getAttribute('name');
            if (name) return name.replace(/[_-]/g, ' ').trim();
        }

        // 4. Für Buttons: value oder textContent
        if (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type))) {
            if (el.value) return el.value.trim();
            const text = el.textContent.trim();
            if (text) return text;
        }

        // 5. Für Links und andere Elemente: textContent
        if (el.tagName === 'A' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link') {
            const text = el.textContent.trim();
            if (text) return text;
            const img = el.querySelector('img');
            if (img && img.alt) return img.alt.trim();
            const title = el.getAttribute('title');
            if (title) return title.trim();
        }

        // 6. title-Attribut
        const title = el.getAttribute('title');
        if (title) return title.trim();

        // 7. textContent für alles andere
        const text = el.textContent.trim().replace(/\s+/g, ' ');
        return text.substring(0, 100);
    }

    /**
     * Generiert eine menschenlesbare Beschreibung für eine Aktion
     */
    function generateDescription(el, actionType) {
        const name = getAccessibleName(el);
        const tagName = el.tagName.toLowerCase();

        if (!name) {
            return `${actionType === 'input' ? 'Eingabefeld ausfüllen' : 'Element anklicken'}`;
        }

        switch (actionType) {
            case 'click':
                if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
                    return `Klicke auf "${name}"`;
                } else if (el.tagName === 'A') {
                    return `Klicke auf den Link "${name}"`;
                } else if (el.tagName === 'INPUT' && el.type === 'checkbox') {
                    return `Aktiviere "${name}"`;
                } else if (el.tagName === 'INPUT' && el.type === 'radio') {
                    return `Wähle "${name}"`;
                } else {
                    return `Klicke auf "${name}"`;
                }
            case 'input':
                return `Gib Text ein in "${name}"`;
            case 'select':
                return `Wähle eine Option in "${name}"`;
            default:
                return `Interagiere mit "${name}"`;
        }
    }

    // ==========================================
    // UI erstellen
    // ==========================================

    function createUI(resuming = false) {
        // Styles einfügen
        if (!document.getElementById('swf-recorder-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'swf-recorder-styles';
            styleEl.textContent = styles;
            document.head.appendChild(styleEl);
        }

        // Panel erstellen
        const panel = document.createElement('div');
        panel.id = 'swf-recorder-panel';
        panel.innerHTML = `
            <div class="swf-recorder-header">
                <div class="swf-recorder-title">
                    <span class="swf-recorder-dot"></span>
                    <span>${resuming ? 'Aufnahme fortgesetzt' : 'Aufnahme aktiv'}</span>
                </div>
                <button class="swf-recorder-close" id="swf-close-btn" title="Abbrechen">×</button>
            </div>

            <div style="background: rgba(255,255,255,0.15); padding: 10px 12px; border-radius: 6px; margin-bottom: 10px;">
                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">Schritt aufnehmen:</div>
                <div style="font-size: 16px; font-weight: 600;" id="swf-hotkey-display">
                    🎯 ${config.triggerKeyDisplay}
                </div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
                    Normale Klicks funktionieren normal.<br>
                    Alt+Klick = Schritt aufzeichnen
                </div>
            </div>

            <div class="swf-recorder-stats">
                <span id="swf-step-count">${state.steps.length}</span> Schritte aufgenommen
            </div>

            <div class="swf-recorder-buttons">
                <button class="swf-recorder-btn swf-recorder-btn-pause" id="swf-pause-btn">
                    ⏸ Pause
                </button>
                <button class="swf-recorder-btn swf-recorder-btn-manual" id="swf-manual-btn">
                    + Text
                </button>
                <button class="swf-recorder-btn swf-recorder-btn-stop" id="swf-stop-btn">
                    ✓ Fertig
                </button>
            </div>

            <div style="font-size: 10px; opacity: 0.6; margin-top: 10px; text-align: center;">
                💡 Nach Seitenwechsel: Bookmarklet erneut klicken
            </div>
        `;
        document.body.appendChild(panel);

        // Event Listener
        document.getElementById('swf-close-btn').addEventListener('click', cancelRecording);
        document.getElementById('swf-pause-btn').addEventListener('click', togglePause);
        document.getElementById('swf-manual-btn').addEventListener('click', addManualStep);
        document.getElementById('swf-stop-btn').addEventListener('click', stopRecording);

        makeDraggable(panel);
        setupKeyboardListeners();
    }

    function setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' && !state.triggerKeyPressed) {
                state.triggerKeyPressed = true;
                updateHotkeyDisplay(true);
                e.preventDefault();
            }
        }, true);

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') {
                state.triggerKeyPressed = false;
                updateHotkeyDisplay(false);
            }
        }, true);

        window.addEventListener('blur', () => {
            state.triggerKeyPressed = false;
            updateHotkeyDisplay(false);
        });
    }

    function updateHotkeyDisplay(isActive) {
        const display = document.getElementById('swf-hotkey-display');
        if (display) {
            if (isActive) {
                display.innerHTML = '🎯 <span style="color: #ffeb3b;">ALT GEDRÜCKT - Jetzt klicken!</span>';
                display.style.animation = 'swf-blink 0.5s infinite';
            } else {
                display.innerHTML = `🎯 ${config.triggerKeyDisplay}`;
                display.style.animation = 'none';
            }
        }
    }

    function makeDraggable(element) {
        let isDragging = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            element.style.left = (e.clientX - offsetX) + 'px';
            element.style.top = (e.clientY - offsetY) + 'px';
            element.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = 'move';
        });
    }

    function updateStepCount() {
        const countEl = document.getElementById('swf-step-count');
        if (countEl) {
            countEl.textContent = state.steps.length;
        }
    }

    // ==========================================
    // Event Handler
    // ==========================================

    let lastHoveredElement = null;

    function handleMouseOver(e) {
        if (state.paused || !state.recording) return;

        const target = e.target;
        if (target.closest('#swf-recorder-panel') ||
            target.closest('#swf-description-popup') ||
            target.closest('#swf-manual-popup')) {
            return;
        }

        if (lastHoveredElement && lastHoveredElement !== target) {
            lastHoveredElement.classList.remove('swf-hover-highlight');
        }

        target.classList.add('swf-hover-highlight');
        lastHoveredElement = target;
    }

    function handleMouseOut(e) {
        if (e.target.classList) {
            e.target.classList.remove('swf-hover-highlight');
        }
    }

    function handleClick(e) {
        if (state.paused || !state.recording) return;

        const target = e.target;

        // Recorder UI ignorieren
        if (target.closest('#swf-recorder-panel') ||
            target.closest('#swf-description-popup') ||
            target.closest('#swf-manual-popup') ||
            target.closest('.swf-popup-overlay')) {
            return;
        }

        // Nur bei gedrückter Alt-Taste aufnehmen
        if (!e.altKey && !state.triggerKeyPressed) {
            return; // Normaler Klick - nicht aufnehmen, durchlassen
        }

        // Interaktives Element finden
        const el = findInteractiveElement(target);
        if (!el) return;

        // Schritt automatisch aufzeichnen (ohne Popup)
        recordElementInteraction(el, 'click');

        // Kurze visuelle Bestätigung anzeigen
        showRecordedFeedback(el);

        // Klick NICHT blockieren - Aktion wird normal ausgeführt
        // Der Benutzer kann die Seite normal bedienen
    }

    function findInteractiveElement(target) {
        // Schon interaktiv?
        if (isInteractive(target)) return target;

        // Nach oben suchen
        let current = target.parentElement;
        let depth = 0;
        while (current && current !== document.body && depth < 5) {
            if (isInteractive(current)) return current;
            current = current.parentElement;
            depth++;
        }

        // Fallback: Original-Element
        return target;
    }

    function isInteractive(el) {
        const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'];
        if (interactiveTags.includes(el.tagName)) return true;

        const role = el.getAttribute('role');
        const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'tab', 'checkbox', 'radio', 'switch', 'textbox', 'combobox'];
        if (role && interactiveRoles.includes(role)) return true;

        if (el.onclick || el.getAttribute('onclick')) return true;
        if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') return true;

        return false;
    }

    function shouldBlockDefault(el) {
        // Diese Elemente nicht blockieren
        const noBlock = ['SELECT', 'OPTION', 'INPUT', 'TEXTAREA'];
        if (noBlock.includes(el.tagName)) return false;
        if (el.closest('select')) return false;
        if (el.tagName === 'SUMMARY') return false;

        return true;
    }

    function handleInput(e) {
        if (state.paused || !state.recording) return;
        if (config.recordingMode === 'manual') return; // Input nur im Auto-Modus

        const target = e.target;
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

        // Debounce für Texteingaben
        clearTimeout(target._swfInputTimeout);
        target._swfInputTimeout = setTimeout(() => {
            recordElementInteraction(target, target.tagName === 'SELECT' ? 'select' : 'input');
        }, 500);
    }

    // ==========================================
    // Schritt aufnehmen
    // ==========================================

    function recordElementInteraction(el, actionType) {
        const accessibleName = getAccessibleName(el);
        const description = generateDescription(el, actionType);

        const step = {
            type: actionType === 'select' ? 'click' : actionType,
            trigger: accessibleName, // Der Text, nach dem der Player sucht
            description: description,
            url: window.location.href,
            isEntryPoint: state.steps.length === 0
        };

        // Für Eingabefelder: Beispielwert
        if (actionType === 'input' && el.value) {
            step.exampleValue = el.value.substring(0, 50);
        }

        state.steps.push(step);
        updateStepCount();
        saveStateToStorage();

        // Visuelles Feedback
        el.classList.add('swf-recorded-element');
        setTimeout(() => el.classList.remove('swf-recorded-element'), 1000);

        console.log('SWF: Schritt aufgenommen:', step);
    }

    function showRecordedFeedback(el) {
        // Kurze Toast-Benachrichtigung
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #2e7d32;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 2147483647;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: swf-toast-in 0.3s ease;
        `;
        toast.textContent = `✓ Schritt ${state.steps.length} aufgezeichnet`;
        document.body.appendChild(toast);

        // Element hervorheben
        const rect = el.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 4}px;
            left: ${rect.left - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 3px solid #2e7d32;
            border-radius: 4px;
            pointer-events: none;
            z-index: 2147483646;
            animation: swf-highlight-pulse 0.5s ease;
        `;
        document.body.appendChild(highlight);

        // Nach kurzer Zeit entfernen
        setTimeout(() => {
            toast.remove();
            highlight.remove();
        }, 1500);
    }

    function showDescriptionPopup(el) {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'swf-popup-overlay';
        overlay.id = 'swf-popup-overlay';
        document.body.appendChild(overlay);

        const accessibleName = getAccessibleName(el);
        const suggestedDescription = generateDescription(el, 'click');

        const popup = document.createElement('div');
        popup.id = 'swf-description-popup';
        popup.innerHTML = `
            <h3>Schritt beschreiben</h3>
            <div class="popup-info">
                <strong>Erkanntes Element:</strong> ${accessibleName || '(kein Name erkannt)'}<br>
                <strong>Trigger-Text:</strong> ${accessibleName || '(manuell eingeben)'}
            </div>
            <label style="display: block; font-weight: 500; margin-bottom: 6px;">Beschreibung für den Nutzer:</label>
            <textarea id="swf-description-text" placeholder="Was soll der Nutzer hier tun?">${suggestedDescription}</textarea>
            <div class="popup-buttons">
                <button class="btn-skip" id="swf-desc-skip">Überspringen</button>
                <button class="btn-save" id="swf-desc-save">Speichern</button>
            </div>
        `;
        document.body.appendChild(popup);

        const textarea = document.getElementById('swf-description-text');
        textarea.focus();
        textarea.select();

        const closePopup = () => {
            overlay.remove();
            popup.remove();
        };

        document.getElementById('swf-desc-save').addEventListener('click', () => {
            const description = textarea.value.trim() || suggestedDescription;

            const step = {
                type: 'click',
                trigger: accessibleName,
                description: description,
                url: window.location.href,
                isEntryPoint: state.steps.length === 0
            };

            state.steps.push(step);
            updateStepCount();
            saveStateToStorage();

            el.classList.add('swf-recorded-element');
            setTimeout(() => el.classList.remove('swf-recorded-element'), 1000);

            closePopup();
        });

        document.getElementById('swf-desc-skip').addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
    }

    // ==========================================
    // Manueller Schritt (lokale Aktion)
    // ==========================================

    function addManualStep() {
        const overlay = document.createElement('div');
        overlay.className = 'swf-popup-overlay';
        overlay.id = 'swf-popup-overlay';
        document.body.appendChild(overlay);

        const popup = document.createElement('div');
        popup.id = 'swf-manual-popup';
        popup.innerHTML = `
            <h3>📁 Manuellen Schritt hinzufügen</h3>
            <label>Art des Schritts:</label>
            <select id="swf-manual-type">
                <option value="local_action">Lokale Aktion (nicht am Computer)</option>
                <option value="wait">Warten (Zeit oder Bedingung)</option>
            </select>
            <label>Beschreibung:</label>
            <textarea id="swf-manual-desc" placeholder="Was soll der Nutzer tun?"></textarea>
            <label>Detaillierte Anleitung (optional):</label>
            <textarea id="swf-manual-instruction" placeholder="Schritt-für-Schritt Anleitung..."></textarea>
            <div class="popup-buttons">
                <button class="btn-cancel" id="swf-manual-cancel">Abbrechen</button>
                <button class="btn-add" id="swf-manual-add">Hinzufügen</button>
            </div>
        `;
        document.body.appendChild(popup);

        const closePopup = () => {
            overlay.remove();
            popup.remove();
        };

        document.getElementById('swf-manual-add').addEventListener('click', () => {
            const type = document.getElementById('swf-manual-type').value;
            const desc = document.getElementById('swf-manual-desc').value.trim();
            const instruction = document.getElementById('swf-manual-instruction').value.trim();

            if (!desc) {
                alert('Bitte eine Beschreibung eingeben.');
                return;
            }

            state.steps.push({
                type: type,
                description: desc,
                instruction: instruction || undefined,
                isEntryPoint: false
            });

            updateStepCount();
            saveStateToStorage();
            closePopup();
        });

        document.getElementById('swf-manual-cancel').addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
    }

    // ==========================================
    // Aufnahme-Steuerung
    // ==========================================

    function togglePause() {
        state.paused = !state.paused;
        const panel = document.getElementById('swf-recorder-panel');
        const pauseBtn = document.getElementById('swf-pause-btn');

        if (state.paused) {
            panel.classList.add('paused');
            pauseBtn.innerHTML = '▶ Weiter';
        } else {
            panel.classList.remove('paused');
            pauseBtn.innerHTML = '⏸ Pause';
        }

        saveStateToStorage();
    }

    function cancelRecording() {
        if (confirm('Aufnahme wirklich abbrechen? Alle Schritte gehen verloren.')) {
            cleanup();
            clearStorage();
            window._swfRecorder = false;
        }
    }

    function stopRecording() {
        if (state.steps.length === 0) {
            alert('Keine Schritte aufgenommen. Nimm mindestens einen Schritt auf.');
            return;
        }

        // Tutorial-Daten erstellen
        const tutorialData = {
            name: 'Neues Tutorial',
            description: 'Tutorial erstellt am ' + new Date().toLocaleDateString('de-DE'),
            startUrl: state.startUrl,
            steps: state.steps
        };

        // In localStorage speichern für die Tutorial-Werkstatt
        try {
            const storageKey = 'swf_tutorials';
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            tutorialData.id = 'tutorial_' + Date.now();
            existing.push(tutorialData);
            localStorage.setItem(storageKey, JSON.stringify(existing));
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
        }

        // Zusammenfassung anzeigen
        showSummary(tutorialData);
    }

    function showSummary(tutorialData) {
        cleanup();

        const overlay = document.createElement('div');
        overlay.className = 'swf-popup-overlay';
        overlay.id = 'swf-popup-overlay';
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        const popup = document.createElement('div');
        popup.id = 'swf-description-popup';
        popup.style.maxWidth = '600px';
        popup.innerHTML = `
            <h3 style="color: #2e7d32;">✓ Tutorial aufgenommen!</h3>
            <div class="popup-info">
                <strong>${tutorialData.steps.length} Schritte</strong> wurden aufgenommen.<br>
                Start-URL: ${tutorialData.startUrl.substring(0, 50)}...
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-weight: 500; margin-bottom: 6px;">Tutorial-Name:</label>
                <input type="text" id="swf-tutorial-name" value="${tutorialData.name}" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-weight: 500; margin-bottom: 6px;">Aufgenommene Schritte:</label>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; max-height: 200px; overflow-y: auto; font-size: 13px;">
                    ${tutorialData.steps.map((step, i) => `
                        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ddd;">
                            <strong>${i + 1}.</strong> ${step.description || step.trigger || step.type}
                            ${step.trigger ? `<br><span style="color: #666; font-size: 11px;">Trigger: "${step.trigger}"</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="popup-buttons">
                <button class="btn-skip" id="swf-summary-close">Schließen</button>
                <button class="btn-save" id="swf-open-editor">In Editor öffnen</button>
            </div>
        `;
        document.body.appendChild(popup);

        document.getElementById('swf-summary-close').addEventListener('click', () => {
            // Namen aktualisieren
            const name = document.getElementById('swf-tutorial-name').value.trim();
            if (name) {
                try {
                    const storageKey = 'swf_tutorials';
                    const tutorials = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const tutorial = tutorials.find(t => t.id === tutorialData.id);
                    if (tutorial) {
                        tutorial.name = name;
                        localStorage.setItem(storageKey, JSON.stringify(tutorials));
                    }
                } catch (e) {}
            }

            overlay.remove();
            popup.remove();
            clearStorage();
            window._swfRecorder = false;
        });

        document.getElementById('swf-open-editor').addEventListener('click', () => {
            // Versuche die Tutorial-Werkstatt zu öffnen
            const name = document.getElementById('swf-tutorial-name').value.trim();
            if (name) {
                try {
                    const storageKey = 'swf_tutorials';
                    const tutorials = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const tutorial = tutorials.find(t => t.id === tutorialData.id);
                    if (tutorial) {
                        tutorial.name = name;
                        localStorage.setItem(storageKey, JSON.stringify(tutorials));
                    }
                } catch (e) {}
            }

            overlay.remove();
            popup.remove();
            clearStorage();
            window._swfRecorder = false;

            alert('Tutorial gespeichert! Öffne die Tutorial-Werkstatt (index.html) um es zu bearbeiten und ein Bookmarklet zu erstellen.');
        });
    }

    function cleanup() {
        // UI entfernen
        const elements = ['swf-recorder-panel', 'swf-description-popup', 'swf-manual-popup', 'swf-popup-overlay', 'swf-recorder-styles'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Event Listener entfernen
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('input', handleInput);
    }

    // ==========================================
    // Initialisierung
    // ==========================================

    function init() {
        // Prüfen ob Session fortgesetzt werden soll
        const wasResumed = loadStateFromStorage();

        if (wasResumed && state.recording) {
            createUI(true);
            console.log('SWF: Aufnahme fortgesetzt mit', state.steps.length, 'Schritten');
        } else {
            state.recording = true;
            state.steps = [];
            state.startUrl = window.location.href;
            createUI(false);
            saveStateToStorage();
        }

        // Event Listener
        document.addEventListener('click', handleClick, true);
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('input', handleInput);

        // Vor Seitenwechsel speichern
        window.addEventListener('beforeunload', saveStateToStorage);
    }

    // Starten
    init();

})();
