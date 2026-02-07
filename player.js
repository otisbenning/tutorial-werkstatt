/**
 * Tutorial-Werkstatt - Player (Screenreader-Ansatz)
 * Spielt Tutorial-Schritte ab und führt Nutzer durch Webseiten
 *
 * Verwendet einen Screenreader-ähnlichen Ansatz:
 * Statt komplexer CSS-Selektoren wird die Seite als "barrierefreier Text"
 * gescannt und Elemente werden über ihren lesbaren Namen gefunden.
 */

(function() {
    'use strict';

    // ==========================================
    // Session Storage Keys für Persistenz
    // ==========================================

    const STORAGE_KEYS = {
        PLAYER_ACTIVE: 'swf_player_active',
        PLAYER_DATA: 'swf_player_data',
        PLAYER_STEP: 'swf_player_step'
    };

    // ==========================================
    // Konfiguration
    // ==========================================

    let tutorialData = null;
    let currentStep = 0;

    // ==========================================
    // Persistenz-Funktionen (für Seitenwechsel)
    // ==========================================

    function savePlayerState() {
        if (!tutorialData) return;
        try {
            sessionStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(tutorialData));
            sessionStorage.setItem(STORAGE_KEYS.PLAYER_STEP, currentStep.toString());
            sessionStorage.setItem(STORAGE_KEYS.PLAYER_ACTIVE, 'true');
        } catch (e) {
            console.error('SWF Player: Fehler beim Speichern:', e);
        }
    }

    function loadPlayerState() {
        try {
            const dataJson = sessionStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
            const stepStr = sessionStorage.getItem(STORAGE_KEYS.PLAYER_STEP);
            if (dataJson) {
                tutorialData = JSON.parse(dataJson);
                currentStep = stepStr ? parseInt(stepStr, 10) : 0;
                return true;
            }
            return false;
        } catch (e) {
            console.error('SWF Player: Fehler beim Laden:', e);
            return false;
        }
    }

    function clearPlayerStorage() {
        try {
            sessionStorage.removeItem(STORAGE_KEYS.PLAYER_ACTIVE);
            sessionStorage.removeItem(STORAGE_KEYS.PLAYER_DATA);
            sessionStorage.removeItem(STORAGE_KEYS.PLAYER_STEP);
        } catch (e) {
            console.error('SWF Player: Fehler beim Leeren:', e);
        }
    }

    // ==========================================
    // CSS Styles
    // ==========================================

    const styles = `
        .swf-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.4);
            z-index: 999998;
            pointer-events: none;
        }

        .swf-highlight {
            position: absolute;
            border: 3px solid #2e7d32;
            border-radius: 4px;
            box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.3), 0 0 20px rgba(46, 125, 50, 0.5);
            pointer-events: none;
            z-index: 999999;
            animation: swf-pulse 2s infinite;
        }

        @keyframes swf-pulse {
            0%, 100% { box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.3), 0 0 20px rgba(46, 125, 50, 0.5); }
            50% { box-shadow: 0 0 0 8px rgba(46, 125, 50, 0.2), 0 0 30px rgba(46, 125, 50, 0.4); }
        }

        .swf-tooltip {
            position: absolute;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            min-width: 280px;
            max-width: 400px;
            z-index: 1000000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: swf-fadeIn 0.3s ease;
        }

        @keyframes swf-fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .swf-tooltip-header {
            background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .swf-tooltip-title {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .swf-tooltip-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .swf-tooltip-close:hover {
            background: rgba(255,255,255,0.3);
        }

        .swf-tooltip-body {
            padding: 16px;
        }

        .swf-tooltip-description {
            font-size: 15px;
            line-height: 1.5;
            color: #333;
            margin-bottom: 16px;
        }

        .swf-tooltip-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid #eee;
        }

        .swf-tooltip-progress {
            font-size: 13px;
            color: #666;
        }

        .swf-tooltip-nav {
            display: flex;
            gap: 8px;
        }

        .swf-tooltip-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }

        .swf-tooltip-btn-secondary {
            background: #f5f5f5;
            color: #333;
        }

        .swf-tooltip-btn-secondary:hover {
            background: #e0e0e0;
        }

        .swf-tooltip-btn-primary {
            background: #2e7d32;
            color: white;
        }

        .swf-tooltip-btn-primary:hover {
            background: #1b5e20;
        }

        .swf-welcome {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            text-align: center;
            max-width: 450px;
            z-index: 1000001;
            animation: swf-scaleIn 0.4s ease;
        }

        @keyframes swf-scaleIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .swf-welcome-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }

        .swf-welcome h2 {
            color: #2e7d32;
            margin: 0 0 8px;
            font-size: 28px;
        }

        .swf-welcome p {
            color: #666;
            margin: 0 0 24px;
            line-height: 1.6;
        }

        .swf-welcome-start {
            background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
            color: white;
            border: none;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 30px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .swf-welcome-start:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(46, 125, 50, 0.4);
        }

        .swf-entry-points {
            margin-top: 20px;
            text-align: left;
        }

        .swf-entry-points h4 {
            color: #333;
            margin: 0 0 12px;
            font-size: 14px;
        }

        .swf-entry-point-btn {
            display: block;
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 8px;
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
            font-size: 14px;
        }

        .swf-entry-point-btn:hover {
            background: #e8f5e9;
            border-color: #2e7d32;
        }

        .swf-entry-point-btn .step-num {
            font-weight: 600;
            color: #2e7d32;
        }

        .swf-not-found {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff3e0;
            border: 2px solid #f57c00;
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000001;
            max-width: 500px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .swf-not-found h4 {
            margin: 0 0 12px;
            color: #e65100;
            font-size: 16px;
        }

        .swf-not-found p {
            margin: 0 0 16px;
            color: #333;
            font-size: 14px;
            line-height: 1.5;
        }

        .swf-not-found .search-term {
            background: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 13px;
            margin: 12px 0;
            border: 1px solid #ddd;
        }

        .swf-not-found .button-row {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
        }
    `;

    // ==========================================
    // Hilfsfunktionen
    // ==========================================

    function $(selector) {
        return document.querySelector(selector);
    }

    function $create(tag, props) {
        const el = document.createElement(tag);
        if (props) {
            Object.keys(props).forEach(key => {
                if (key === 'className') {
                    el.className = props[key];
                } else if (key === 'style' && typeof props[key] === 'object') {
                    Object.assign(el.style, props[key]);
                } else {
                    el[key] = props[key];
                }
            });
        }
        return el;
    }

    function injectStyles() {
        if ($('#swf-player-styles')) return;
        const styleEl = $create('style', { id: 'swf-player-styles' });
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    function cleanup() {
        const ids = ['swf-overlay', 'swf-welcome', 'swf-highlight', 'swf-tooltip',
                     'swf-local-action', 'swf-wrong-url', 'swf-not-found'];
        ids.forEach(id => {
            const el = $('#' + id);
            if (el) el.remove();
        });
    }

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
        }

        // 4. Für Buttons: value oder textContent
        if (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type))) {
            if (el.value) return el.value.trim();
            if (el.textContent) return el.textContent.trim();
        }

        // 5. Für Links und andere Elemente: textContent
        if (el.tagName === 'A' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link') {
            const text = el.textContent.trim();
            if (text) return text;
            // Für Icon-Links: title oder alt von Bildern
            const img = el.querySelector('img');
            if (img && img.alt) return img.alt.trim();
            const title = el.getAttribute('title');
            if (title) return title.trim();
        }

        // 6. title-Attribut als letzter Fallback
        const title = el.getAttribute('title');
        if (title) return title.trim();

        // 7. textContent für alles andere
        return el.textContent.trim().replace(/\s+/g, ' ').substring(0, 100);
    }

    /**
     * Scannt die Seite und erstellt eine Map von Texten zu Elementen.
     * Ähnlich wie ein Screenreader die Seite "sieht".
     */
    function scanPageForAccessibleElements() {
        const elements = [];

        // Alle interaktiven Elemente sammeln
        const interactiveSelectors = [
            'button',
            'a[href]',
            'input',
            'select',
            'textarea',
            '[role="button"]',
            '[role="link"]',
            '[role="menuitem"]',
            '[role="option"]',
            '[role="tab"]',
            '[role="checkbox"]',
            '[role="radio"]',
            '[role="switch"]',
            '[role="combobox"]',
            '[role="listbox"]',
            '[tabindex]:not([tabindex="-1"])',
            'summary',
            '[onclick]',
            '[data-toggle]',
            '[data-bs-toggle]',
            '.btn',
            '.button',
            '.dropdown-item',
            '.nav-link',
            '.menu-item',
            '.ui-menu-item',
            '.ui-menu-item-wrapper'
        ];

        const allElements = document.querySelectorAll(interactiveSelectors.join(', '));

        allElements.forEach(el => {
            // Nur sichtbare Elemente
            if (!isElementVisible(el)) return;

            const accessibleName = getAccessibleName(el);
            if (!accessibleName) return;

            elements.push({
                element: el,
                accessibleName: accessibleName.toLowerCase(),
                originalName: accessibleName,
                tagName: el.tagName,
                type: el.type || null,
                role: el.getAttribute('role') || null
            });
        });

        return elements;
    }

    /**
     * Prüft ob ein Element sichtbar ist
     */
    function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    // ==========================================
    // ELEMENT-FINDUNG: Screenreader-basiert
    // ==========================================

    /**
     * Findet ein Element basierend auf dem Trigger-Text.
     * Verwendet den Screenreader-Ansatz.
     */
    function findElement(step) {
        const trigger = step.trigger || step.accessibleName || step.text || step.description;

        if (!trigger) {
            console.warn('SWF Player: Kein Trigger-Text für Schritt definiert');
            return null;
        }

        console.log('SWF Player: Suche nach:', trigger);

        const searchText = trigger.toLowerCase().trim();
        const pageElements = scanPageForAccessibleElements();

        // Strategie 1: Exakter Match
        let match = pageElements.find(item => item.accessibleName === searchText);
        if (match) {
            console.log('SWF Player: Exakter Match gefunden:', match.originalName);
            return match.element;
        }

        // Strategie 2: Enthält den Suchtext
        match = pageElements.find(item => item.accessibleName.includes(searchText));
        if (match) {
            console.log('SWF Player: Partial Match gefunden:', match.originalName);
            return match.element;
        }

        // Strategie 3: Suchtext enthält den Element-Text (für kurze Button-Texte)
        match = pageElements.find(item =>
            item.accessibleName.length > 2 && searchText.includes(item.accessibleName)
        );
        if (match) {
            console.log('SWF Player: Reverse Match gefunden:', match.originalName);
            return match.element;
        }

        // Strategie 4: Fuzzy-Match (einzelne Wörter)
        const searchWords = searchText.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
            match = pageElements.find(item => {
                return searchWords.every(word => item.accessibleName.includes(word));
            });
            if (match) {
                console.log('SWF Player: Fuzzy Match gefunden:', match.originalName);
                return match.element;
            }
        }

        // Strategie 5: Fallback auf alte CSS-Selector-Methode (für Kompatibilität)
        if (step.selector || step.c) {
            const selector = step.selector || step.c;
            try {
                const el = document.querySelector(selector);
                if (el && isElementVisible(el)) {
                    console.log('SWF Player: CSS-Selector Fallback:', selector);
                    return el;
                }
            } catch (e) {
                console.warn('SWF Player: Ungültiger Selector:', selector);
            }
        }

        console.warn('SWF Player: Element nicht gefunden für:', trigger);
        return null;
    }

    /**
     * Wartet auf ein Element (für dynamisch geladene Inhalte)
     */
    async function waitForElement(step, maxWaitMs = 10000) {
        const startTime = Date.now();
        const pollInterval = 300;

        while (Date.now() - startTime < maxWaitMs) {
            const el = findElement(step);
            if (el) return el;
            await new Promise(r => setTimeout(r, pollInterval));
        }

        console.warn('SWF Player: Timeout beim Warten auf Element');
        return null;
    }

    // ==========================================
    // URL Prüfung
    // ==========================================

    function checkUrl(expectedUrl) {
        if (!expectedUrl) return true;

        const current = window.location.href.split('?')[0].split('#')[0];
        const expected = expectedUrl.split('?')[0].split('#')[0];

        const currentDomain = current.replace(/https?:\/\//, '').split('/')[0];
        const expectedDomain = expected.replace(/https?:\/\//, '').split('/')[0];

        return currentDomain === expectedDomain ||
               current.includes(expectedDomain) ||
               expected.includes(currentDomain);
    }

    // ==========================================
    // UI: Welcome Screen
    // ==========================================

    function showWelcome() {
        injectStyles();
        cleanup();

        const overlay = $create('div', { className: 'swf-overlay', id: 'swf-overlay' });
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        const steps = tutorialData.steps || tutorialData.s || [];
        const entryPoints = steps
            .map((step, index) => ({ step, index }))
            .filter(({ step }) => step.isEntryPoint || step.e);

        let entryHtml = '';
        if (entryPoints.length > 1) {
            entryHtml = '<div class="swf-entry-points"><h4>Oder starte bei einem anderen Schritt:</h4>';
            entryPoints.forEach(({ step, index }) => {
                const desc = step.description || step.d || `Schritt ${index + 1}`;
                entryHtml += `<button class="swf-entry-point-btn" data-step="${index}">
                    <span class="step-num">Schritt ${index + 1}:</span> ${desc}
                </button>`;
            });
            entryHtml += '</div>';
        }

        const welcome = $create('div', { className: 'swf-welcome', id: 'swf-welcome' });
        const name = tutorialData.name || tutorialData.n || 'Tutorial';
        const description = tutorialData.description || tutorialData.d || 'Lass uns gemeinsam durch diese Anleitung gehen!';

        welcome.innerHTML = `
            <div class="swf-welcome-icon">🌱</div>
            <h2>Start with a Friend</h2>
            <p><strong>${name}</strong></p>
            <p>${description}</p>
            <button class="swf-welcome-start" id="swf-start">Los geht's!</button>
            ${entryHtml}
        `;

        document.body.appendChild(welcome);

        $('#swf-start').addEventListener('click', () => {
            cleanup();
            showStep(0);
        });

        welcome.querySelectorAll('.swf-entry-point-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                cleanup();
                showStep(parseInt(btn.dataset.step));
            });
        });
    }

    // ==========================================
    // UI: Schritt anzeigen
    // ==========================================

    async function showStep(index) {
        currentStep = index;
        const steps = tutorialData.steps || tutorialData.s || [];

        savePlayerState();

        if (index >= steps.length) {
            showCompletion();
            return;
        }

        const step = steps[index];
        injectStyles();
        cleanup();

        const stepType = step.type || step.t;

        // Lokale Aktion, Navigation, Warten
        if (stepType === 'local_action' || stepType === 'navigate' || stepType === 'wait') {
            showLocalAction(step, index);
            return;
        }

        // URL prüfen
        const stepUrl = step.url || step.u;
        if (stepUrl && !checkUrl(stepUrl)) {
            showWrongUrl(stepUrl, index);
            return;
        }

        // Element finden
        const element = await waitForElement(step, 8000);

        if (!element) {
            showElementNotFound(step, index);
            return;
        }

        showHighlight(element, step, index);
    }

    function showHighlight(element, step, index) {
        const steps = tutorialData.steps || tutorialData.s || [];
        const description = step.description || step.d || 'Führe diesen Schritt aus';
        const name = tutorialData.name || tutorialData.n || 'Tutorial';

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = element.getBoundingClientRect();

            const highlight = $create('div', {
                className: 'swf-highlight',
                id: 'swf-highlight'
            });
            highlight.style.cssText = `
                top: ${rect.top + window.scrollY - 5}px;
                left: ${rect.left + window.scrollX - 5}px;
                width: ${rect.width + 10}px;
                height: ${rect.height + 10}px;
            `;
            document.body.appendChild(highlight);

            const tooltip = $create('div', {
                className: 'swf-tooltip',
                id: 'swf-tooltip'
            });

            const isOptional = step.optional || step.o;
            const canGoBack = index > 0;

            tooltip.innerHTML = `
                <div class="swf-tooltip-header">
                    <span class="swf-tooltip-title">🌱 ${name}</span>
                    <button class="swf-tooltip-close" id="swf-close">×</button>
                </div>
                <div class="swf-tooltip-body">
                    <div class="swf-tooltip-description">${description}</div>
                    <div class="swf-tooltip-footer">
                        <span class="swf-tooltip-progress">Schritt ${index + 1} von ${steps.length}</span>
                        <div class="swf-tooltip-nav">
                            ${canGoBack ? '<button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-prev">← Zurück</button>' : ''}
                            ${isOptional ? '<button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-skip">Überspringen</button>' : ''}
                            <button class="swf-tooltip-btn swf-tooltip-btn-primary" id="swf-next">Weiter →</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(tooltip);

            // Tooltip positionieren
            let top = rect.top + window.scrollY - tooltip.offsetHeight - 20;
            if (top < window.scrollY + 10) {
                top = rect.bottom + window.scrollY + 20;
            }
            let left = Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - tooltip.offsetWidth - 10));
            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';

            // Event Listener
            $('#swf-close').addEventListener('click', cleanupAndClearStorage);
            if ($('#swf-prev')) {
                $('#swf-prev').addEventListener('click', () => {
                    cleanup();
                    showStep(index - 1);
                });
            }
            if ($('#swf-skip')) {
                $('#swf-skip').addEventListener('click', () => {
                    cleanup();
                    showStep(index + 1);
                });
            }
            $('#swf-next').addEventListener('click', () => {
                cleanup();
                showStep(index + 1);
            });

        }, 300);
    }

    // ==========================================
    // UI: Spezielle Schritte
    // ==========================================

    function showLocalAction(step, index) {
        const steps = tutorialData.steps || tutorialData.s || [];
        const description = step.description || step.d || 'Führe diese Aktion aus';
        const instruction = step.instruction || step.i || '';
        const stepType = step.type || step.t;

        const overlay = $create('div', { className: 'swf-overlay', id: 'swf-overlay' });
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        const popup = $create('div', {
            className: 'swf-welcome',
            id: 'swf-local-action'
        });

        const icon = stepType === 'navigate' ? '🔗' : (stepType === 'wait' ? '⏳' : '📁');

        popup.innerHTML = `
            <div class="swf-welcome-icon">${icon}</div>
            <h2 style="color: #5d4037;">${description}</h2>
            ${instruction ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: left; margin: 20px 0; line-height: 1.6;">${instruction}</div>` : ''}
            <div style="margin-top: 24px;">
                ${index > 0 ? '<button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-prev" style="margin-right: 12px;">← Zurück</button>' : ''}
                <button class="swf-welcome-start" id="swf-done">Erledigt ✓</button>
            </div>
            <p style="margin-top: 16px; font-size: 13px; color: #999;">Schritt ${index + 1} von ${steps.length}</p>
        `;

        document.body.appendChild(popup);

        $('#swf-done').addEventListener('click', () => {
            cleanup();
            showStep(index + 1);
        });
        if ($('#swf-prev')) {
            $('#swf-prev').addEventListener('click', () => {
                cleanup();
                showStep(index - 1);
            });
        }
    }

    function showWrongUrl(expectedUrl, stepIndex) {
        injectStyles();
        cleanup();

        const overlay = $create('div', { className: 'swf-overlay', id: 'swf-overlay' });
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        const notice = $create('div', {
            className: 'swf-welcome',
            id: 'swf-wrong-url'
        });

        notice.innerHTML = `
            <div class="swf-welcome-icon">🧭</div>
            <h2 style="color: #f57c00;">Andere Seite erwartet</h2>
            <p>Du bist gerade auf:</p>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 12px 0;">
                ${window.location.href.substring(0, 80)}...
            </div>
            <p>Erwartete Seite:</p>
            <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 12px 0;">
                ${expectedUrl}
            </div>
            <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
                <button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-cancel">Abbrechen</button>
                <button class="swf-tooltip-btn swf-tooltip-btn-primary" id="swf-go">Zur Seite gehen</button>
            </div>
        `;

        document.body.appendChild(notice);

        $('#swf-go').addEventListener('click', () => {
            const url = new URL(expectedUrl);
            url.searchParams.set('_swf_step', stepIndex);
            url.searchParams.set('_swf_data', btoa(unescape(encodeURIComponent(JSON.stringify(tutorialData)))));
            window.location.href = url.toString();
        });
        $('#swf-cancel').addEventListener('click', cleanupAndClearStorage);
    }

    function showElementNotFound(step, index) {
        injectStyles();

        const trigger = step.trigger || step.accessibleName || step.text || step.description;
        const description = step.description || step.d || 'Unbekannter Schritt';

        const notice = $create('div', {
            className: 'swf-not-found',
            id: 'swf-not-found'
        });

        notice.innerHTML = `
            <h4>Element nicht gefunden</h4>
            <p>${description}</p>
            <div class="search-term">Gesucht: "${trigger || 'Kein Trigger definiert'}"</div>
            <p style="font-size: 12px; color: #666;">
                Das Element ist möglicherweise noch nicht geladen oder die Seite hat sich geändert.
            </p>
            <div class="button-row">
                <button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-retry">Erneut suchen</button>
                <button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-skip">Überspringen</button>
                <button class="swf-tooltip-btn swf-tooltip-btn-secondary" id="swf-cancel">Abbrechen</button>
            </div>
        `;

        document.body.appendChild(notice);

        $('#swf-retry').addEventListener('click', () => {
            notice.remove();
            showStep(index);
        });
        $('#swf-skip').addEventListener('click', () => {
            notice.remove();
            showStep(index + 1);
        });
        $('#swf-cancel').addEventListener('click', () => {
            notice.remove();
            cleanupAndClearStorage();
        });
    }

    function showCompletion() {
        injectStyles();
        cleanup();
        clearPlayerStorage();

        const overlay = $create('div', { className: 'swf-overlay', id: 'swf-overlay' });
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        const complete = $create('div', { className: 'swf-welcome', id: 'swf-welcome' });
        complete.innerHTML = `
            <div class="swf-welcome-icon">🎉</div>
            <h2>Geschafft!</h2>
            <p>Du hast das Tutorial erfolgreich abgeschlossen.</p>
            <button class="swf-welcome-start" id="swf-close">Schließen</button>
        `;

        document.body.appendChild(complete);

        $('#swf-close').addEventListener('click', cleanup);
    }

    function cleanupAndClearStorage() {
        cleanup();
        clearPlayerStorage();
    }

    // ==========================================
    // Initialisierung
    // ==========================================

    function init() {
        const urlParams = new URLSearchParams(window.location.search);

        // 1. Aus URL-Parameter
        if (urlParams.has('_swf_data')) {
            try {
                const dataStr = urlParams.get('_swf_data');
                tutorialData = JSON.parse(decodeURIComponent(escape(atob(dataStr))));
            } catch (e) {
                console.error('Fehler beim Parsen der Tutorial-Daten:', e);
            }
        }

        // 2. Aus globalem Objekt
        if (!tutorialData && window._swfTutorialData) {
            tutorialData = window._swfTutorialData;
        }

        // 3. Aus sessionStorage
        if (!tutorialData) {
            loadPlayerState();
        }

        if (!tutorialData) {
            console.error('Keine Tutorial-Daten gefunden');
            return;
        }

        window.addEventListener('beforeunload', savePlayerState);

        if (urlParams.has('_swf_step')) {
            showStep(parseInt(urlParams.get('_swf_step')));
        } else if (currentStep > 0) {
            showStep(currentStep);
        } else {
            showWelcome();
        }
    }

    // Export
    window.SWFPlayer = {
        init: init,
        showStep: showStep,
        showWelcome: showWelcome,
        cleanup: cleanup,
        setTutorialData: function(data) {
            tutorialData = data;
        },
        // Neue Screenreader-Funktionen exportieren
        scanPage: scanPageForAccessibleElements,
        getAccessibleName: getAccessibleName
    };

    // Auto-Start
    const params = new URLSearchParams(window.location.search);
    if (params.has('_swf_data') || params.has('_swf_step')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();
