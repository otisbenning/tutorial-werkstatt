/**
 * Tutorial-Werkstatt - Hauptanwendung (Screenreader-Ansatz)
 * Editor für Tutorial-Bookmarklets
 *
 * Verwendet einen vereinfachten Ansatz:
 * Statt komplexer Selektoren wird der "Trigger-Text" (accessible name) verwendet.
 */

(function() {
    'use strict';

    // ==========================================
    // Konfiguration & Zustand
    // ==========================================

    const STORAGE_KEY = 'swf_tutorials';
    const APP_VERSION = '2.0.0';

    let tutorials = [];
    let currentTutorial = null;
    let currentStepIndex = null;
    let draggedStepIndex = null;

    // ==========================================
    // DOM Elemente
    // ==========================================

    const elements = {
        recorderBookmarklet: document.getElementById('recorderBookmarklet'),
        btnNewTutorial: document.getElementById('btnNewTutorial'),
        btnImport: document.getElementById('btnImport'),
        btnExportAll: document.getElementById('btnExportAll'),
        fileImport: document.getElementById('fileImport'),
        tutorialList: document.getElementById('tutorialList'),
        emptyState: document.getElementById('emptyState'),
        noTutorialSelected: document.getElementById('noTutorialSelected'),
        tutorialEditor: document.getElementById('tutorialEditor'),
        tutorialName: document.getElementById('tutorialName'),
        tutorialDescription: document.getElementById('tutorialDescription'),
        tutorialStartUrl: document.getElementById('tutorialStartUrl'),
        stepsList: document.getElementById('stepsList'),
        btnAddStep: document.getElementById('btnAddStep'),
        generatedBookmarklet: document.getElementById('generatedBookmarklet'),
        bookmarkletName: document.getElementById('bookmarkletName'),
        btnCopyBookmarklet: document.getElementById('btnCopyBookmarklet'),
        btnExportTutorial: document.getElementById('btnExportTutorial'),
        btnSaveTutorial: document.getElementById('btnSaveTutorial'),
        btnDeleteTutorial: document.getElementById('btnDeleteTutorial'),
        stepModal: document.getElementById('stepModal'),
        stepModalTitle: document.getElementById('stepModalTitle'),
        btnCloseStepModal: document.getElementById('btnCloseStepModal'),
        stepType: document.getElementById('stepType'),
        stepDescription: document.getElementById('stepDescription'),
        stepSelector: document.getElementById('stepSelector'),
        stepSelectorEnd: document.getElementById('stepSelectorEnd'),
        stepMatchThreshold: document.getElementById('stepMatchThreshold'),
        thresholdValue: document.getElementById('thresholdValue'),
        stepUrl: document.getElementById('stepUrl'),
        stepUrlPattern: document.getElementById('stepUrlPattern'),
        stepInputValue: document.getElementById('stepInputValue'),
        stepLocalInstruction: document.getElementById('stepLocalInstruction'),
        stepOptional: document.getElementById('stepOptional'),
        stepEntryPoint: document.getElementById('stepEntryPoint'),
        selectorGroup: document.getElementById('selectorGroup'),
        selectorEndGroup: document.getElementById('selectorEndGroup'),
        matchThresholdGroup: document.getElementById('matchThresholdGroup'),
        urlGroup: document.getElementById('urlGroup'),
        urlPatternGroup: document.getElementById('urlPatternGroup'),
        inputValueGroup: document.getElementById('inputValueGroup'),
        localInstructionGroup: document.getElementById('localInstructionGroup'),
        btnSaveStep: document.getElementById('btnSaveStep'),
        btnCancelStep: document.getElementById('btnCancelStep'),
        newTutorialModal: document.getElementById('newTutorialModal'),
        btnCloseNewModal: document.getElementById('btnCloseNewModal'),
        newTutorialName: document.getElementById('newTutorialName'),
        newTutorialStartUrl: document.getElementById('newTutorialStartUrl'),
        btnCreateTutorial: document.getElementById('btnCreateTutorial'),
        btnCancelNewTutorial: document.getElementById('btnCancelNewTutorial'),
        toastContainer: document.getElementById('toastContainer')
    };

    // ==========================================
    // Hilfsfunktionen
    // ==========================================

    function generateId() {
        return 'tutorial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function showToast(message, type) {
        type = type || 'info';
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        elements.toastContainer.appendChild(toast);
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==========================================
    // LocalStorage
    // ==========================================

    function loadTutorials() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            tutorials = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Fehler beim Laden:', e);
            tutorials = [];
        }
    }

    function saveTutorials() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tutorials));
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
            showToast('Fehler beim Speichern!', 'error');
        }
    }

    // ==========================================
    // Tutorial Liste
    // ==========================================

    function renderTutorialList() {
        elements.tutorialList.innerHTML = '';

        if (tutorials.length === 0) {
            elements.emptyState.style.display = 'block';
            return;
        }

        elements.emptyState.style.display = 'none';

        tutorials.forEach(function(tutorial) {
            var li = document.createElement('li');
            li.className = 'tutorial-list-item';
            if (currentTutorial && currentTutorial.id === tutorial.id) {
                li.classList.add('active');
            }

            li.innerHTML = '<div class="tutorial-info">' +
                '<div class="tutorial-name">' + escapeHtml(tutorial.name || 'Unbenannt') + '</div>' +
                '<div class="tutorial-meta">' + (tutorial.steps ? tutorial.steps.length : 0) + ' Schritte</div>' +
                '</div>' +
                '<div class="tutorial-actions">' +
                '<button class="btn btn-small btn-icon" data-action="edit" title="Bearbeiten">✏️</button>' +
                '<button class="btn btn-small btn-icon" data-action="delete" title="Löschen">🗑️</button>' +
                '</div>';

            li.querySelector('.tutorial-info').addEventListener('click', function() { selectTutorial(tutorial.id); });
            li.querySelector('[data-action="edit"]').addEventListener('click', function(e) {
                e.stopPropagation();
                selectTutorial(tutorial.id);
            });
            li.querySelector('[data-action="delete"]').addEventListener('click', function(e) {
                e.stopPropagation();
                deleteTutorial(tutorial.id);
            });

            elements.tutorialList.appendChild(li);
        });
    }

    function selectTutorial(id) {
        currentTutorial = tutorials.find(function(t) { return t.id === id; });
        if (!currentTutorial) return;

        elements.noTutorialSelected.style.display = 'none';
        elements.tutorialEditor.style.display = 'block';

        elements.tutorialName.value = currentTutorial.name || '';
        elements.tutorialDescription.value = currentTutorial.description || '';
        elements.tutorialStartUrl.value = currentTutorial.startUrl || '';

        renderStepsList();
        updateBookmarklet();
        renderTutorialList();
    }

    function deleteTutorial(id) {
        if (!confirm('Tutorial wirklich löschen?')) return;

        tutorials = tutorials.filter(function(t) { return t.id !== id; });
        saveTutorials();

        if (currentTutorial && currentTutorial.id === id) {
            currentTutorial = null;
            elements.tutorialEditor.style.display = 'none';
            elements.noTutorialSelected.style.display = 'flex';
        }

        renderTutorialList();
        showToast('Tutorial gelöscht', 'success');
    }

    // ==========================================
    // Schritte Editor
    // ==========================================

    function renderStepsList() {
        elements.stepsList.innerHTML = '';

        if (!currentTutorial || !currentTutorial.steps || currentTutorial.steps.length === 0) {
            elements.stepsList.innerHTML = '<li class="empty-state">Noch keine Schritte. Starte eine Aufnahme oder füge manuell Schritte hinzu.</li>';
            return;
        }

        currentTutorial.steps.forEach(function(step, index) {
            var li = document.createElement('li');
            li.className = 'step-item';
            li.draggable = true;
            li.dataset.index = index;

            var typeLabels = {
                click: 'Klick',
                input: 'Eingabe',
                navigate: 'Navigation',
                local_action: 'Lokal',
                wait: 'Warten'
            };

            var badges = '';
            if (step.optional) badges += '<span class="step-badge badge-optional">Optional</span>';
            if (step.isEntryPoint) badges += '<span class="step-badge badge-entry">Einstieg</span>';

            // Trigger-Info anzeigen (neuer Ansatz)
            var triggerInfo = '';
            if (step.trigger) {
                triggerInfo = 'Trigger: "' + escapeHtml(step.trigger.substring(0, 40)) + '"';
            } else if (step.description) {
                triggerInfo = 'Sucht nach: "' + escapeHtml(step.description.substring(0, 40)) + '"';
            }

            li.innerHTML = '<div class="step-number">' + (index + 1) + '</div>' +
                '<div class="step-content">' +
                '<span class="step-type type-' + step.type + '">' + (typeLabels[step.type] || step.type) + '</span>' +
                '<div class="step-description">' + escapeHtml(step.description || 'Keine Beschreibung') + '</div>' +
                '<div class="step-meta">' + triggerInfo + '</div>' +
                (badges ? '<div class="step-badges">' + badges + '</div>' : '') +
                '</div>' +
                '<div class="step-actions">' +
                '<button class="btn btn-small" data-action="edit" title="Bearbeiten">✏️</button>' +
                '<button class="btn btn-small" data-action="up" title="Nach oben"' + (index === 0 ? ' disabled' : '') + '>↑</button>' +
                '<button class="btn btn-small" data-action="down" title="Nach unten"' + (index === currentTutorial.steps.length - 1 ? ' disabled' : '') + '>↓</button>' +
                '<button class="btn btn-small" data-action="delete" title="Löschen">🗑️</button>' +
                '</div>';

            li.querySelector('[data-action="edit"]').addEventListener('click', function() { openStepModal(index); });
            li.querySelector('[data-action="up"]').addEventListener('click', function() { moveStep(index, -1); });
            li.querySelector('[data-action="down"]').addEventListener('click', function() { moveStep(index, 1); });
            li.querySelector('[data-action="delete"]').addEventListener('click', function() { deleteStep(index); });

            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragend', handleDragEnd);

            elements.stepsList.appendChild(li);
        });
    }

    function moveStep(index, direction) {
        var newIndex = index + direction;
        if (newIndex < 0 || newIndex >= currentTutorial.steps.length) return;
        var step = currentTutorial.steps.splice(index, 1)[0];
        currentTutorial.steps.splice(newIndex, 0, step);
        renderStepsList();
        updateBookmarklet();
    }

    function deleteStep(index) {
        if (!confirm('Schritt wirklich löschen?')) return;
        currentTutorial.steps.splice(index, 1);
        renderStepsList();
        updateBookmarklet();
    }

    function handleDragStart(e) {
        draggedStepIndex = parseInt(e.target.dataset.index);
        e.target.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        var item = e.target.closest('.step-item');
        if (item) item.classList.add('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        var item = e.target.closest('.step-item');
        if (!item) return;
        var dropIndex = parseInt(item.dataset.index);
        if (draggedStepIndex === dropIndex) return;
        var step = currentTutorial.steps.splice(draggedStepIndex, 1)[0];
        currentTutorial.steps.splice(dropIndex, 0, step);
        renderStepsList();
        updateBookmarklet();
    }

    function handleDragEnd(e) {
        document.querySelectorAll('.step-item').forEach(function(item) {
            item.classList.remove('dragging', 'drag-over');
        });
        draggedStepIndex = null;
    }

    // ==========================================
    // Step Modal
    // ==========================================

    function openStepModal(index) {
        currentStepIndex = index !== undefined ? index : null;
        var step = currentStepIndex !== null ? currentTutorial.steps[currentStepIndex] : null;

        elements.stepModalTitle.textContent = step ? 'Schritt bearbeiten' : 'Neuen Schritt hinzufügen';

        elements.stepType.value = (step && step.type) || 'click';
        elements.stepDescription.value = (step && step.description) || '';
        elements.stepSelector.value = (step && (step.trigger || step.selector)) || '';
        elements.stepSelectorEnd.value = (step && step.triggerEnd) || '';
        elements.stepUrl.value = (step && step.url) || '';
        if (elements.stepUrlPattern) {
            elements.stepUrlPattern.value = (step && step.urlPattern) || '';
        }
        elements.stepInputValue.value = (step && step.exampleValue) || '';
        elements.stepLocalInstruction.value = (step && step.instruction) || '';
        elements.stepOptional.checked = (step && step.optional) || false;
        elements.stepEntryPoint.checked = (step && step.isEntryPoint) || false;

        // Match-Schwellenwert
        var threshold = (step && step.matchThreshold) || 50;
        elements.stepMatchThreshold.value = threshold;
        elements.thresholdValue.textContent = threshold;

        updateStepModalFields();
        elements.stepModal.style.display = 'flex';
    }

    function closeStepModal() {
        elements.stepModal.style.display = 'none';
        currentStepIndex = null;
    }

    function updateStepModalFields() {
        var type = elements.stepType.value;

        elements.inputValueGroup.style.display = 'none';
        elements.localInstructionGroup.style.display = 'none';
        elements.selectorGroup.style.display = 'block';
        elements.selectorEndGroup.style.display = 'none';
        elements.matchThresholdGroup.style.display = 'block';
        elements.urlGroup.style.display = 'block';
        if (elements.urlPatternGroup) elements.urlPatternGroup.style.display = 'block';

        switch (type) {
            case 'input':
                elements.inputValueGroup.style.display = 'block';
                break;
            case 'local_action':
                elements.localInstructionGroup.style.display = 'block';
                elements.selectorGroup.style.display = 'none';
                elements.matchThresholdGroup.style.display = 'none';
                if (elements.urlPatternGroup) elements.urlPatternGroup.style.display = 'none';
                break;
            case 'navigate':
            case 'wait':
                elements.selectorGroup.style.display = 'none';
                elements.matchThresholdGroup.style.display = 'none';
                break;
            case 'highlight_area':
                elements.selectorEndGroup.style.display = 'block';
                break;
        }
    }

    function saveStep() {
        var stepType = elements.stepType.value;
        var step = {
            type: stepType,
            description: elements.stepDescription.value,
            trigger: elements.stepSelector.value, // Trigger-Text für Element-Suche
            url: elements.stepUrl.value,
            urlPattern: elements.stepUrlPattern ? elements.stepUrlPattern.value : '',
            optional: elements.stepOptional.checked,
            isEntryPoint: elements.stepEntryPoint.checked
        };

        // Match-Schwellenwert (nur wenn nicht Standard)
        var threshold = parseInt(elements.stepMatchThreshold.value);
        if (threshold !== 50) {
            step.matchThreshold = threshold;
        }

        if (stepType === 'input') {
            step.exampleValue = elements.stepInputValue.value;
        }

        if (stepType === 'local_action') {
            step.instruction = elements.stepLocalInstruction.value;
        }

        // Bereich markieren: End-Element speichern
        if (stepType === 'highlight_area') {
            step.triggerEnd = elements.stepSelectorEnd.value;
        }

        if (currentStepIndex !== null) {
            currentTutorial.steps[currentStepIndex] = step;
        } else {
            if (!currentTutorial.steps) currentTutorial.steps = [];
            currentTutorial.steps.push(step);
        }

        closeStepModal();
        renderStepsList();
        updateBookmarklet();
    }

    // ==========================================
    // Bookmarklet Generator (VEREINFACHT - Screenreader-Ansatz)
    // ==========================================

    function updateBookmarklet() {
        if (!currentTutorial) return;

        var name = currentTutorial.name || 'Tutorial';
        elements.bookmarkletName.textContent = name;

        var playerCode = generatePlayerCode(currentTutorial);
        elements.generatedBookmarklet.href = playerCode;
    }

    /**
     * Generiert den Player-Code mit:
     * - Fortschritt-Persistenz (sessionStorage)
     * - Seitenleiste mit Schritt-Übersicht
     * - Hinweis vor Seitenwechsel
     * - Verbessertes Element-Matching (Muster statt exakter Text)
     */
    function generatePlayerCode(tutorial) {
        // Tutorial-Daten kompakt
        var tutorialData = {
            n: tutorial.name,
            d: tutorial.description,
            u: tutorial.startUrl,
            s: tutorial.steps.map(function(s, idx) {
                var step = {
                    t: s.type,
                    d: s.description,
                    tr: s.trigger || s.description,
                    u: s.url,
                    up: s.urlPattern || '',  // URL-Muster für flexible Matching
                    o: s.optional,
                    e: s.isEntryPoint,
                    v: s.exampleValue,
                    i: s.instruction,
                    idx: idx
                };
                // Match-Schwellenwert (nur wenn nicht Standard)
                if (s.matchThreshold && s.matchThreshold !== 50) {
                    step.mt = s.matchThreshold;
                }
                // End-Trigger für Bereich-Markierung
                if (s.triggerEnd) {
                    step.te = s.triggerEnd;
                }
                return step;
            })
        };

        // Tutorial-ID für Storage
        var tutorialId = 'swf_player_' + (tutorial.id || tutorial.name.replace(/\s+/g, '_'));

        var playerScript = `(function(){
"use strict";

// Tutorial-Daten
var d = ${JSON.stringify(tutorialData)};
var STORAGE_KEY = "${tutorialId}";

// State laden oder initialisieren
var currentStep = 0;
var completedSteps = [];
try {
    var saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
        var state = JSON.parse(saved);
        currentStep = state.step || 0;
        completedSteps = state.completed || [];
    }
} catch(e) {}

// State speichern
function saveState() {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            step: currentStep,
            completed: completedSteps,
            url: location.href
        }));
    } catch(e) {}
}

// State löschen
function clearState() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
}

// Hilfsfunktionen
function $(q) { try { return document.querySelector(q); } catch(e) { return null; } }
function $$(q) { try { return document.querySelectorAll(q); } catch(e) { return []; } }
function $c(t, a) { var e = document.createElement(t); if(a) Object.keys(a).forEach(function(k){ e[k] = a[k]; }); return e; }

// ==========================================
// VERBESSERTES ELEMENT-MATCHING
// ==========================================

// Accessible Name berechnen
function getAccName(el) {
    if (!el || el.nodeType !== 1) return "";

    // aria-label
    var aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();

    // aria-labelledby
    var labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
        var parts = labelledBy.split(/\\s+/).map(function(id) {
            var lbl = document.getElementById(id);
            return lbl ? lbl.textContent.trim() : "";
        }).filter(Boolean);
        if (parts.length) return parts.join(" ");
    }

    // Input-Elemente
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
        if (el.id) {
            var lbl = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
            if (lbl) return lbl.textContent.trim();
        }
        var parentLabel = el.closest("label");
        if (parentLabel) {
            var clone = parentLabel.cloneNode(true);
            clone.querySelectorAll("input,select,textarea").forEach(function(i) { i.remove(); });
            var t = clone.textContent.trim();
            if (t) return t;
        }
        if (el.placeholder) return el.placeholder.trim();
        if (el.name) return el.name;
    }

    // Buttons
    if (tag === "BUTTON" || (tag === "INPUT" && ["submit","button","reset"].includes(el.type))) {
        return el.value || el.textContent.trim() || el.getAttribute("title") || "";
    }

    // Links
    if (tag === "A") {
        var img = el.querySelector("img[alt]");
        if (img) return img.alt;
        return el.textContent.trim() || el.getAttribute("title") || "";
    }

    return el.textContent.trim().substring(0, 80);
}

// Element-Typ extrahieren (für strukturelles Matching)
function getElementType(el) {
    var tag = el.tagName.toLowerCase();
    var type = el.getAttribute("type") || "";
    var role = el.getAttribute("role") || "";

    if (tag === "input") return "input-" + (type || "text");
    if (tag === "button" || role === "button") return "button";
    if (tag === "a" || role === "link") return "link";
    if (tag === "select") return "select";
    if (tag === "textarea") return "textarea";
    return tag;
}

// Seite scannen - alle interaktiven Elemente sammeln
function scanPage() {
    var elements = [];
    var selectors = "button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=link],[role=menuitem],[role=option],[role=tab],[tabindex]:not([tabindex='-1']),summary,[onclick],.btn,.button";

    $$(selectors).forEach(function(el, index) {
        if (!isVisible(el)) return;
        var name = getAccName(el);
        elements.push({
            el: el,
            name: name,
            nameLower: name.toLowerCase(),
            type: getElementType(el),
            index: index
        });
    });

    return elements;
}

// Sichtbarkeit prüfen (inkl. Overlay-Erkennung)
function isVisible(el) {
    if (!el) return false;

    // Basis-Checks
    var st = window.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0") return false;

    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;

    // Prüfen ob Element oder Parent aria-hidden ist
    if (el.closest("[aria-hidden='true']")) return false;

    // Prüfen ob Element im sichtbaren Viewport ist
    if (r.bottom < 0 || r.top > window.innerHeight ||
        r.right < 0 || r.left > window.innerWidth) return false;

    // OVERLAY-ERKENNUNG: Prüfen ob Element tatsächlich erreichbar ist
    // Wir testen mehrere Punkte im Element
    var points = [
        { x: r.left + r.width / 2, y: r.top + r.height / 2 },  // Mitte
        { x: r.left + 5, y: r.top + 5 },                        // Oben-Links
        { x: r.right - 5, y: r.top + 5 },                       // Oben-Rechts
        { x: r.left + 5, y: r.bottom - 5 },                     // Unten-Links
        { x: r.right - 5, y: r.bottom - 5 }                     // Unten-Rechts
    ];

    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        // Punkt muss im Viewport sein
        if (p.x < 0 || p.x > window.innerWidth || p.y < 0 || p.y > window.innerHeight) continue;

        var topEl = document.elementFromPoint(p.x, p.y);
        if (topEl) {
            // Prüfen ob das gefundene Element unser Element ist oder darin enthalten
            if (topEl === el || el.contains(topEl) || topEl.contains(el)) {
                return true; // Element ist erreichbar!
            }
        }
    }

    // Keiner der Punkte war erreichbar - Element ist verdeckt
    return false;
}

// Wörter aus Text extrahieren (für Fuzzy-Matching)
function extractWords(text) {
    return text.toLowerCase()
        .replace(/[^a-zäöüß0-9\\s]/gi, " ")
        .split(/\\s+/)
        .filter(function(w) { return w.length > 2; });
}

// VERBESSERTES MATCHING: Mehrere Strategien + ODER-Logik + Schwellenwert
function findElement(step, triggerOverride) {
    var trigger = triggerOverride || (step.tr || step.d || "").trim();
    if (!trigger) return null;

    // Match-Schwellenwert aus Step (Standard: 50)
    var threshold = step.mt || 50;

    // ODER-Logik: Trigger kann mehrere Alternativen enthalten, getrennt durch |
    var alternatives = trigger.split("|").map(function(t) { return t.trim(); }).filter(Boolean);

    var elements = scanPage();

    // Für jede Alternative versuchen zu finden
    for (var altIdx = 0; altIdx < alternatives.length; altIdx++) {
        var altTrigger = alternatives[altIdx];
        var result = findElementByTrigger(altTrigger, elements, threshold);
        if (result) {
            result.matchedTrigger = altTrigger;
            return result;
        }
    }

    return null;
}

// Score berechnen für Element-Match
function calculateMatchScore(searchLower, searchWords, item) {
    var score = 0;
    var itemWords = extractWords(item.name);

    // 1. Exakter Match = höchste Punktzahl
    if (item.nameLower === searchLower) {
        return 1000;
    }

    // 2. Vollständiger Substring-Match (Trigger komplett im Element)
    if (item.nameLower.indexOf(searchLower) !== -1) {
        score += 100;
        // Bonus wenn Längen ähnlich sind (verhindert Match auf viel längere Texte)
        var lengthRatio = searchLower.length / item.nameLower.length;
        score += Math.round(lengthRatio * 50);
    }

    // 3. Wort-basiertes Scoring
    if (searchWords.length > 0) {
        var matchedSearchWords = 0;
        var matchedItemWords = 0;

        // Wie viele Suchwörter sind im Element?
        searchWords.forEach(function(sw) {
            if (item.nameLower.indexOf(sw) !== -1) {
                matchedSearchWords++;
                // Bonus für längere übereinstimmende Wörter
                score += sw.length;
            }
        });

        // Wie viele Element-Wörter sind im Suchtext?
        itemWords.forEach(function(iw) {
            if (searchLower.indexOf(iw) !== -1) {
                matchedItemWords++;
            }
        });

        // Prozent der gefundenen Suchwörter (wichtigster Faktor!)
        var searchWordRatio = matchedSearchWords / searchWords.length;
        score += Math.round(searchWordRatio * 80);

        // KRITISCH: Alle Suchwörter müssen vorkommen für hohen Score
        if (matchedSearchWords === searchWords.length) {
            score += 50; // Bonus für vollständigen Match
        }

        // Prozent der Element-Wörter die im Suchtext sind
        if (itemWords.length > 0) {
            var itemWordRatio = matchedItemWords / itemWords.length;
            score += Math.round(itemWordRatio * 30);
        }
    }

    return score;
}

// Einzelnen Trigger suchen - MIT SCORING UND SCHWELLENWERT
function findElementByTrigger(trigger, elements, threshold) {
    threshold = threshold || 50; // Standard-Schwellenwert
    var searchLower = trigger.toLowerCase();
    var searchWords = extractWords(trigger);

    // Strategie 1: Exakter Match (sofort zurück)
    var match = elements.find(function(item) {
        return item.nameLower === searchLower;
    });
    if (match) return { el: match.el, strategy: "exact", score: 1000 };

    // Strategie 2: Score-basiertes Matching - findet BESTEN Match
    var bestMatch = null;
    var bestScore = 0;
    var bestStrategy = "scored";

    elements.forEach(function(item) {
        var score = calculateMatchScore(searchLower, searchWords, item);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    });

    // Dynamischer Mindest-Score basierend auf Schwellenwert
    // Schwellenwert 50 = Mindest-Score 50 (Standard)
    // Schwellenwert 100 = Mindest-Score 150 (sehr streng, fast nur exakte Matches)
    var minScore = 50 + (threshold - 50);

    if (bestMatch && bestScore >= minScore) {
        // Strategie-Namen basierend auf Score
        if (bestScore >= 150) bestStrategy = "partial";
        else if (bestScore >= 100) bestStrategy = "words-all";
        else bestStrategy = "words-partial";

        return { el: bestMatch.el, strategy: bestStrategy, score: bestScore };
    }

    // Strategie 3: STRUKTURELLES MATCHING (Fallback)
    // Wenn der Trigger wie ein generisches Label klingt, nach Element-Typ suchen
    var genericPatterns = [
        { pattern: /bearbeiten|edit|ändern/i, types: ["button", "link"] },
        { pattern: /speichern|save/i, types: ["button", "input-submit"] },
        { pattern: /löschen|delete|entfernen/i, types: ["button", "link"] },
        { pattern: /suche|search/i, types: ["input-text", "input-search"] },
        { pattern: /name|namen/i, types: ["input-text"] },
        { pattern: /email|e-mail/i, types: ["input-email", "input-text"] },
        { pattern: /passwort|password/i, types: ["input-password"] },
        { pattern: /weiter|next|fortfahren/i, types: ["button", "input-submit"] },
        { pattern: /zurück|back|abbrechen|cancel/i, types: ["button", "link"] }
    ];

    for (var i = 0; i < genericPatterns.length; i++) {
        var gp = genericPatterns[i];
        if (gp.pattern.test(trigger)) {
            match = elements.find(function(item) {
                return gp.types.includes(item.type);
            });
            if (match) return { el: match.el, strategy: "structural" };
        }
    }

    // Strategie 4: Erstes Element des passenden Typs
    if (/button|schaltfläche|knopf/i.test(trigger)) {
        match = elements.find(function(item) { return item.type === "button"; });
        if (match) return { el: match.el, strategy: "type-button" };
    }
    if (/link|verweis/i.test(trigger)) {
        match = elements.find(function(item) { return item.type === "link"; });
        if (match) return { el: match.el, strategy: "type-link" };
    }
    if (/eingabe|feld|input/i.test(trigger)) {
        match = elements.find(function(item) { return item.type.startsWith("input-"); });
        if (match) return { el: match.el, strategy: "type-input" };
    }

    return null;
}

// Warten auf Element
function waitForElement(step, callback, maxWait) {
    maxWait = maxWait || 8000;
    var startTime = Date.now();

    function check() {
        var result = findElement(step);
        if (result) {
            callback(result.el, result.strategy);
            return;
        }
        if (Date.now() - startTime < maxWait) {
            window.setTimeout(check, 300);
        } else {
            callback(null, null);
        }
    }
    check();
}

// ==========================================
// STYLES
// ==========================================

function injectStyles() {
    if ($("#swf-styles")) return;
    var st = $c("style", { id: "swf-styles" });
    st.textContent = \`
        /* Schwebendes Panel */
        .swf-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 280px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 2147483646;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .swf-panel.minimized {
            width: 180px;
        }
        .swf-panel.minimized .swf-panel-body {
            display: none;
        }
        .swf-panel-header {
            background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
            color: #fff;
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        }
        .swf-panel-title {
            font-weight: 600;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .swf-panel-buttons {
            display: flex;
            gap: 4px;
        }
        .swf-panel-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .swf-panel-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        .swf-panel-body {
            max-height: 350px;
            overflow-y: auto;
        }
        .swf-panel-progress {
            padding: 10px 14px;
            background: #f8f8f8;
            border-bottom: 1px solid #eee;
        }
        .swf-progress-bar {
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
        }
        .swf-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4caf50, #2e7d32);
            transition: width 0.3s;
        }
        .swf-progress-text {
            font-size: 11px;
            color: #888;
            margin-top: 4px;
            text-align: center;
        }

        /* Element-Tooltip */
        .swf-tooltip {
            position: fixed;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.15);
            max-width: 300px;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: swf-fade-in 0.2s ease;
        }
        @keyframes swf-fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .swf-tooltip-arrow {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #fff;
            transform: rotate(45deg);
            box-shadow: -2px -2px 4px rgba(0,0,0,0.05);
        }
        .swf-tooltip-arrow.top { bottom: -5px; left: 20px; }
        .swf-tooltip-arrow.bottom { top: -5px; left: 20px; box-shadow: 2px 2px 4px rgba(0,0,0,0.05); }
        .swf-tooltip-content {
            padding: 14px;
        }
        .swf-tooltip-step {
            font-size: 11px;
            color: #2e7d32;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .swf-tooltip-text {
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            margin-bottom: 12px;
        }
        .swf-tooltip-buttons {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .swf-step-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        .swf-step-item {
            padding: 8px 14px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            transition: background 0.2s;
        }
        .swf-step-item:hover { background: #fafafa; }
        .swf-step-item.completed { background: #e8f5e9; }
        .swf-step-item.current { background: #fff3e0; border-left: 3px solid #f57c00; }
        .swf-step-item.skipped { opacity: 0.5; }
        .swf-step-num {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #e0e0e0;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 600;
            flex-shrink: 0;
        }
        .swf-step-item.completed .swf-step-num { background: #4caf50; color: #fff; }
        .swf-step-item.current .swf-step-num { background: #f57c00; color: #fff; }
        .swf-step-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Buttons */
        .swf-btn {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
        }
        .swf-btn-primary { background: #2e7d32; color: #fff; }
        .swf-btn-primary:hover { background: #1b5e20; }
        .swf-btn-secondary { background: #f0f0f0; color: #333; }
        .swf-btn-secondary:hover { background: #e0e0e0; }

        /* Highlight-Ring um Element */
        .swf-highlight {
            position: fixed;
            border: 3px solid #2e7d32;
            border-radius: 6px;
            pointer-events: none;
            z-index: 2147483645;
            box-shadow: 0 0 0 3px rgba(46,125,50,0.2);
            animation: swf-ring-pulse 1.5s ease-in-out infinite;
        }
        @keyframes swf-ring-pulse {
            0%, 100% { box-shadow: 0 0 0 3px rgba(46,125,50,0.2); }
            50% { box-shadow: 0 0 0 6px rgba(46,125,50,0.15), 0 0 15px rgba(46,125,50,0.2); }
        }
        .swf-welcome-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .swf-welcome-box {
            background: #fff;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 450px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .swf-welcome-box h2 {
            color: #2e7d32;
            margin: 16px 0 8px;
        }
        .swf-welcome-box p {
            color: #666;
            margin-bottom: 24px;
        }
        .swf-not-found-panel {
            background: #fff3e0;
            border: 2px solid #f57c00;
            border-radius: 8px;
            padding: 12px;
            margin: 10px;
            font-size: 12px;
        }
        .swf-not-found-panel h4 {
            color: #e65100;
            margin: 0 0 6px 0;
            font-size: 13px;
        }
    \`;
    document.head.appendChild(st);
}

// ==========================================
// UI KOMPONENTEN
// ==========================================

var panel = null;
var highlight = null;
var spotlight = null;
var tooltip = null;
var panelMinimized = false;
var panelDragOffset = { x: 0, y: 0 };

// Spotlight-Overlay erstellen (dunkelt Seite ab, lässt Element frei)
function createSpotlight(el) {
    removeSpotlight();
    if (!el) return;

    var rect = el.getBoundingClientRect();
    var padding = 8;

    spotlight = $c("div", { id: "swf-spotlight" });
    spotlight.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483640;pointer-events:none;";

    // SVG mit Ausschnitt für das Element
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.cssText = "position:absolute;top:0;left:0;";

    var defs = document.createElementNS(svgNS, "defs");
    var mask = document.createElementNS(svgNS, "mask");
    mask.setAttribute("id", "swf-spotlight-mask");

    // Weißer Hintergrund (sichtbar)
    var bgRect = document.createElementNS(svgNS, "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "white");

    // Schwarzes Loch für Element (transparent)
    var hole = document.createElementNS(svgNS, "rect");
    hole.setAttribute("x", rect.left - padding);
    hole.setAttribute("y", rect.top - padding);
    hole.setAttribute("width", rect.width + padding * 2);
    hole.setAttribute("height", rect.height + padding * 2);
    hole.setAttribute("rx", "8");
    hole.setAttribute("fill", "black");

    mask.appendChild(bgRect);
    mask.appendChild(hole);
    defs.appendChild(mask);
    svg.appendChild(defs);

    // Dunkles Overlay mit Maske
    var overlay = document.createElementNS(svgNS, "rect");
    overlay.setAttribute("width", "100%");
    overlay.setAttribute("height", "100%");
    overlay.setAttribute("fill", "rgba(0,0,0,0.6)");
    overlay.setAttribute("mask", "url(#swf-spotlight-mask)");
    svg.appendChild(overlay);

    spotlight.appendChild(svg);
    document.body.appendChild(spotlight);

    // Position bei Scroll aktualisieren
    spotlight._updatePosition = function() {
        var newRect = el.getBoundingClientRect();
        hole.setAttribute("x", newRect.left - padding);
        hole.setAttribute("y", newRect.top - padding);
        hole.setAttribute("width", newRect.width + padding * 2);
        hole.setAttribute("height", newRect.height + padding * 2);
    };

    window.addEventListener("scroll", spotlight._updatePosition, true);
    window.addEventListener("resize", spotlight._updatePosition);
}

function removeSpotlight() {
    if (spotlight) {
        window.removeEventListener("scroll", spotlight._updatePosition, true);
        window.removeEventListener("resize", spotlight._updatePosition);
        spotlight.remove();
        spotlight = null;
    }
}

// Tooltip beim Element anzeigen
function createTooltip(el, step, idx) {
    removeTooltip();
    if (!el) return;

    var rect = el.getBoundingClientRect();

    tooltip = $c("div", { className: "swf-tooltip", id: "swf-tooltip" });

    // Position berechnen (über oder unter dem Element)
    var showAbove = rect.top > 200;
    var top = showAbove ? rect.top - 10 : rect.bottom + 10;
    var left = Math.max(10, Math.min(rect.left, window.innerWidth - 340));

    tooltip.innerHTML =
        '<div class="swf-tooltip-arrow ' + (showAbove ? 'top' : 'bottom') + '"></div>' +
        '<div class="swf-tooltip-content">' +
        '<div class="swf-tooltip-step">Schritt ' + (idx + 1) + ' von ' + d.s.length + '</div>' +
        '<div class="swf-tooltip-text">' + step.d + '</div>' +
        '<div class="swf-tooltip-buttons">' +
        (idx > 0 ? '<button class="swf-btn swf-btn-secondary" id="swf-tip-prev">← Zurück</button>' : '') +
        '<button class="swf-btn swf-btn-secondary" id="swf-tip-skip">Überspringen</button>' +
        '<button class="swf-btn swf-btn-primary" id="swf-tip-done">✓ Erledigt</button>' +
        '</div></div>';

    tooltip.style.cssText = "position:fixed;top:" + (showAbove ? "auto" : top + "px") + ";bottom:" + (showAbove ? (window.innerHeight - rect.top + 10) + "px" : "auto") + ";left:" + left + "px;";

    document.body.appendChild(tooltip);

    if ($("#swf-tip-prev")) {
        $("#swf-tip-prev").addEventListener("click", function() { goToStep(idx - 1); });
    }
    $("#swf-tip-skip").addEventListener("click", function() { goToStep(idx + 1); });
    $("#swf-tip-done").addEventListener("click", function() {
        if (!completedSteps.includes(idx)) completedSteps.push(idx);
        goToStep(idx + 1);
    });
}

function removeTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

// Panel verschiebbar machen
function makePanelDraggable(panelEl) {
    var header = panelEl.querySelector(".swf-panel-header");
    if (!header) return;

    var isDragging = false;

    header.addEventListener("mousedown", function(e) {
        if (e.target.tagName === "BUTTON") return;
        isDragging = true;
        panelDragOffset.x = e.clientX - panelEl.offsetLeft;
        panelDragOffset.y = e.clientY - panelEl.offsetTop;
        header.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", function(e) {
        if (!isDragging) return;
        var x = e.clientX - panelDragOffset.x;
        var y = e.clientY - panelDragOffset.y;
        // Grenzen einhalten
        x = Math.max(0, Math.min(x, window.innerWidth - panelEl.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - panelEl.offsetHeight));
        panelEl.style.left = x + "px";
        panelEl.style.right = "auto";
        panelEl.style.top = y + "px";
    });

    document.addEventListener("mouseup", function() {
        isDragging = false;
        header.style.cursor = "move";
    });
}

function createPanel() {
    if (panel) return;

    panel = $c("div", { className: "swf-panel", id: "swf-panel" });

    var progressPercent = Math.round((completedSteps.length / d.s.length) * 100);

    panel.innerHTML =
        '<div class="swf-panel-header">' +
        '<span class="swf-panel-title">🌱 ' + d.n + '</span>' +
        '<div class="swf-panel-buttons">' +
        '<button class="swf-panel-btn" id="swf-minimize" title="Minimieren">−</button>' +
        '<button class="swf-panel-btn" id="swf-close-panel" title="Beenden">×</button>' +
        '</div></div>' +
        '<div class="swf-panel-body">' +
        '<div class="swf-panel-progress">' +
        '<div class="swf-progress-bar"><div class="swf-progress-fill" style="width:' + progressPercent + '%"></div></div>' +
        '<div class="swf-progress-text">' + completedSteps.length + ' von ' + d.s.length + ' erledigt</div>' +
        '</div>' +
        '<ul class="swf-step-list" id="swf-step-list"></ul>' +
        '</div>';

    document.body.appendChild(panel);

    // Verschiebbar machen
    makePanelDraggable(panel);

    // Minimieren
    $("#swf-minimize").addEventListener("click", function() {
        panelMinimized = !panelMinimized;
        panel.classList.toggle("minimized", panelMinimized);
        this.textContent = panelMinimized ? "+" : "−";
    });

    // Schließen
    $("#swf-close-panel").addEventListener("click", function() {
        if (confirm("Tutorial beenden?")) {
            cleanup();
        }
    });

    updateStepList();
}

function updateStepList() {
    var list = $("#swf-step-list");
    if (!list) return;

    // Fortschrittsbalken aktualisieren
    var progressPercent = Math.round((completedSteps.length / d.s.length) * 100);
    var progressFill = $(".swf-progress-fill");
    var progressText = $(".swf-progress-text");
    if (progressFill) progressFill.style.width = progressPercent + "%";
    if (progressText) progressText.textContent = completedSteps.length + " von " + d.s.length + " erledigt";

    list.innerHTML = d.s.map(function(step, idx) {
        var status = "";
        if (completedSteps.includes(idx)) status = "completed";
        else if (idx === currentStep) status = "current";
        else if (idx < currentStep && !completedSteps.includes(idx)) status = "skipped";

        var number = completedSteps.includes(idx) ? "✓" : (idx + 1);
        var shortDesc = step.d.length > 40 ? step.d.substring(0, 40) + "..." : step.d;

        return '<li class="swf-step-item ' + status + '" data-step="' + idx + '">' +
            '<span class="swf-step-num">' + number + '</span>' +
            '<span class="swf-step-text" title="' + step.d.replace(/"/g, '&quot;') + '">' + shortDesc + '</span></li>';
    }).join("");

    // Klick-Handler für Schritte
    list.querySelectorAll(".swf-step-item").forEach(function(item) {
        item.addEventListener("click", function() {
            var idx = parseInt(this.getAttribute("data-step"));
            goToStep(idx);
        });
    });

    // Zum aktuellen Schritt scrollen
    var currentItem = list.querySelector(".swf-step-item.current");
    if (currentItem) {
        currentItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function updateCurrentStepPanel(step, idx, elementFound, matchStrategy) {
    var container = $("#swf-current-step-container");
    if (!container) return;

    var isLocal = step.t === "local_action" || step.t === "navigate" || step.t === "wait";
    var icon = step.t === "navigate" ? "🔗" : (step.t === "wait" ? "⏳" : (step.t === "local_action" ? "📁" : "👆"));

    var html = '<div class="swf-current-step">' +
        '<h3>' + icon + ' Schritt ' + (idx + 1) + ' von ' + d.s.length + '</h3>' +
        '<p>' + step.d + '</p>';

    if (step.i) {
        html += '<div style="background:#f5f5f5;padding:12px;border-radius:6px;margin-bottom:12px;font-size:13px">' + step.i + '</div>';
    }

    if (!elementFound && !isLocal) {
        html += '<div class="swf-not-found-panel">' +
            '<h4>⚠️ Element nicht gefunden</h4>' +
            '<p style="margin:0;font-size:13px">Gesucht: "' + (step.tr || "") + '"</p>' +
            '</div>';
    }

    if (matchStrategy && matchStrategy !== "exact") {
        html += '<div class="swf-match-info">🔍 Gefunden via: ' + matchStrategy + '</div>';
    }

    html += '<div class="swf-btn-row">';
    if (idx > 0) {
        html += '<button class="swf-btn swf-btn-secondary" id="swf-prev">← Zurück</button>';
    }
    html += '<button class="swf-btn swf-btn-secondary" id="swf-skip">Überspringen</button>';
    html += '<button class="swf-btn swf-btn-primary" id="swf-done">✓ Erledigt</button>';
    html += '</div></div>';

    container.innerHTML = html;

    if ($("#swf-prev")) {
        $("#swf-prev").addEventListener("click", function() { goToStep(idx - 1); });
    }
    $("#swf-skip").addEventListener("click", function() { goToStep(idx + 1); });
    $("#swf-done").addEventListener("click", function() {
        completedSteps.push(idx);
        goToStep(idx + 1);
    });
}

function showHighlight(el, stepIdx, step) {
    removeHighlight();

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Spotlight-Overlay erstellen (dunkelt Seite ab)
    createSpotlight(el);

    // Highlight-Ring um Element
    highlight = $c("div", { className: "swf-highlight", id: "swf-highlight" });
    document.body.appendChild(highlight);

    function updatePosition() {
        if (!highlight || !document.body.contains(highlight)) return;
        var r = el.getBoundingClientRect();
        highlight.style.cssText = "position:fixed;top:" + (r.top - 5) + "px;left:" + (r.left - 5) + "px;width:" + (r.width + 10) + "px;height:" + (r.height + 10) + "px";
        // Spotlight auch aktualisieren
        if (spotlight && spotlight._updatePosition) {
            spotlight._updatePosition();
        }
    }

    // Nach kurzem Delay positionieren (wegen smooth scroll)
    window.setTimeout(function() {
        updatePosition();
        // Tooltip beim Element anzeigen
        if (step) {
            createTooltip(el, step, stepIdx);
        }
    }, 400);

    // Während des Scrollens aktualisieren
    var scrollCount = 0;
    var scrollInterval = window.setInterval(function() {
        updatePosition();
        scrollCount++;
        if (scrollCount > 20) {
            window.clearInterval(scrollInterval);
        }
    }, 50);

    // Bei Scroll und Resize aktualisieren
    var onScroll = function() { updatePosition(); };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    // AUTO-WEITER: Bei Klick auf das Element automatisch zum nächsten Schritt
    var onClick = function(e) {
        if (stepIdx !== undefined && !completedSteps.includes(stepIdx)) {
            completedSteps.push(stepIdx);
        }
        window.setTimeout(function() {
            goToStep(currentStep + 1);
        }, 100);
    };
    el.addEventListener("click", onClick, true);

    // Cleanup-Referenz speichern
    highlight._cleanup = function() {
        window.clearInterval(scrollInterval);
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onScroll);
        el.removeEventListener("click", onClick, true);
        removeSpotlight();
        removeTooltip();
    };
}

// Bereich zwischen zwei Elementen highlighten
function showAreaHighlight(startEl, endEl, stepIdx, step) {
    removeHighlight();

    // Zum Bereich scrollen
    startEl.scrollIntoView({ behavior: "smooth", block: "center" });

    // Bereichs-Rechteck berechnen
    function getAreaRect() {
        var r1 = startEl.getBoundingClientRect();
        var r2 = endEl.getBoundingClientRect();
        return {
            top: Math.min(r1.top, r2.top) - 10,
            left: Math.min(r1.left, r2.left) - 10,
            bottom: Math.max(r1.bottom, r2.bottom) + 10,
            right: Math.max(r1.right, r2.right) + 10
        };
    }

    var areaRect = getAreaRect();

    // Spotlight für den Bereich erstellen
    createSpotlightForArea(areaRect);

    // Highlight-Box für den Bereich
    highlight = $c("div", { className: "swf-highlight swf-area-highlight", id: "swf-highlight" });
    highlight.style.cssText = "position:fixed;top:" + areaRect.top + "px;left:" + areaRect.left + "px;width:" + (areaRect.right - areaRect.left) + "px;height:" + (areaRect.bottom - areaRect.top) + "px;border-style:dashed;";
    document.body.appendChild(highlight);

    function updatePosition() {
        if (!highlight || !document.body.contains(highlight)) return;
        var r = getAreaRect();
        highlight.style.cssText = "position:fixed;top:" + r.top + "px;left:" + r.left + "px;width:" + (r.right - r.left) + "px;height:" + (r.bottom - r.top) + "px;border-style:dashed;";
        if (spotlight && spotlight._updateArea) {
            spotlight._updateArea(r);
        }
    }

    window.setTimeout(function() {
        updatePosition();
        if (step) {
            // Tooltip in der Mitte des Bereichs
            var rect = getAreaRect();
            var fakeEl = { getBoundingClientRect: function() { return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.right - rect.left, height: rect.bottom - rect.top }; } };
            createTooltip(fakeEl, step, stepIdx);
        }
    }, 400);

    var scrollCount = 0;
    var scrollInterval = window.setInterval(function() {
        updatePosition();
        scrollCount++;
        if (scrollCount > 20) window.clearInterval(scrollInterval);
    }, 50);

    var onScroll = function() { updatePosition(); };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    highlight._cleanup = function() {
        window.clearInterval(scrollInterval);
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onScroll);
        removeSpotlight();
        removeTooltip();
    };
}

// Spotlight für Bereich erstellen
function createSpotlightForArea(rect) {
    removeSpotlight();
    var padding = 0; // Bereits in rect eingerechnet

    spotlight = $c("div", { id: "swf-spotlight" });
    spotlight.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483640;pointer-events:none;";

    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.cssText = "position:absolute;top:0;left:0;";

    var defs = document.createElementNS(svgNS, "defs");
    var mask = document.createElementNS(svgNS, "mask");
    mask.setAttribute("id", "swf-spotlight-mask");

    var bgRect = document.createElementNS(svgNS, "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "white");

    var hole = document.createElementNS(svgNS, "rect");
    hole.setAttribute("x", rect.left);
    hole.setAttribute("y", rect.top);
    hole.setAttribute("width", rect.right - rect.left);
    hole.setAttribute("height", rect.bottom - rect.top);
    hole.setAttribute("rx", "8");
    hole.setAttribute("fill", "black");

    mask.appendChild(bgRect);
    mask.appendChild(hole);
    defs.appendChild(mask);
    svg.appendChild(defs);

    var overlay = document.createElementNS(svgNS, "rect");
    overlay.setAttribute("width", "100%");
    overlay.setAttribute("height", "100%");
    overlay.setAttribute("fill", "rgba(0,0,0,0.6)");
    overlay.setAttribute("mask", "url(#swf-spotlight-mask)");
    svg.appendChild(overlay);

    spotlight.appendChild(svg);
    document.body.appendChild(spotlight);

    spotlight._updateArea = function(newRect) {
        hole.setAttribute("x", newRect.left);
        hole.setAttribute("y", newRect.top);
        hole.setAttribute("width", newRect.right - newRect.left);
        hole.setAttribute("height", newRect.bottom - newRect.top);
    };
}

function removeHighlight() {
    if (highlight) {
        if (highlight._cleanup) highlight._cleanup();
        highlight.remove();
        highlight = null;
    }
    var existing = $("#swf-highlight");
    if (existing) {
        if (existing._cleanup) existing._cleanup();
        existing.remove();
    }
}

function showWelcome() {
    injectStyles();

    var overlay = $c("div", { className: "swf-welcome-overlay", id: "swf-welcome" });
    var resumeText = currentStep > 0 ?
        '<p style="color:#f57c00">📍 Fortschritt geladen: Schritt ' + (currentStep + 1) + ' von ' + d.s.length + '</p>' : '';
    var btnText = currentStep > 0 ? "Fortfahren" : "Los geht's!";

    overlay.innerHTML = '<div class="swf-welcome-box">' +
        '<div style="font-size:64px">🌱</div>' +
        '<h2>Start with a Friend</h2>' +
        '<p><strong>' + d.n + '</strong></p>' +
        '<p>' + (d.d || "Lass uns gemeinsam durch diese Anleitung gehen!") + '</p>' +
        resumeText +
        '<button class="swf-btn swf-btn-primary" id="swf-start" style="padding:14px 32px;font-size:16px;border-radius:30px">' + btnText + '</button>' +
        '</div>';

    document.body.appendChild(overlay);

    $("#swf-start").addEventListener("click", function() {
        overlay.remove();
        createPanel();
        goToStep(currentStep);
    });
}

function showComplete() {
    removeHighlight();
    clearState();

    var container = $("#swf-current-step-container");
    if (container) {
        container.innerHTML = '<div class="swf-current-step" style="background:#e8f5e9;border-color:#4caf50">' +
            '<div style="text-align:center">' +
            '<div style="font-size:48px">🎉</div>' +
            '<h3 style="color:#2e7d32">Geschafft!</h3>' +
            '<p>Du hast das Tutorial abgeschlossen.</p>' +
            '<button class="swf-btn swf-btn-primary" id="swf-finish">Schließen</button>' +
            '</div></div>';

        $("#swf-finish").addEventListener("click", cleanup);
    }

    updateStepList();
}

// ==========================================
// NAVIGATION
// ==========================================

function goToStep(idx) {
    removeHighlight();

    if (idx >= d.s.length) {
        showComplete();
        return;
    }

    if (idx < 0) idx = 0;
    currentStep = idx;
    saveState();
    updateStepList();

    var step = d.s[idx];

    // Lokale Aktionen
    if (step.t === "local_action" || step.t === "navigate" || step.t === "wait") {
        updateCurrentStepPanel(step, idx, true, null);
        return;
    }

    // Bereich markieren: Zwei Elemente finden und Bereich highlighten
    if (step.t === "highlight_area" && step.te) {
        waitForElement(step, function(startEl, startStrategy) {
            if (!startEl) {
                updateCurrentStepPanel(step, idx, false, null);
                return;
            }
            // End-Element mit separatem Trigger suchen
            var endResult = findElement(step, step.te);
            if (endResult && endResult.el) {
                showAreaHighlight(startEl, endResult.el, idx, step);
                updateCurrentStepPanel(step, idx, true, startStrategy);
            } else {
                // Fallback: Nur Start-Element highlighten
                showHighlight(startEl, idx, step);
                updateCurrentStepPanel(step, idx, true, startStrategy);
            }
        });
        return;
    }

    // Element suchen
    waitForElement(step, function(el, strategy) {
        if (el) {
            showHighlight(el, idx, step);
            updateCurrentStepPanel(step, idx, true, strategy);
        } else {
            updateCurrentStepPanel(step, idx, false, null);
        }
    });
}

// ==========================================
// SEITENWECHSEL-HANDLING
// ==========================================

// Warnung vor Seitenwechsel
window.addEventListener("beforeunload", function(e) {
    if (panel && currentStep < d.s.length) {
        saveState();
        // Hinweis kann nicht customized werden in modernen Browsern,
        // aber der State ist gespeichert
    }
});

// Bei Klick auf Links: Hinweis zeigen
document.addEventListener("click", function(e) {
    if (!panel) return;

    var link = e.target.closest("a[href]");
    if (!link) return;

    var href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

    // Prüfen ob es ein externer Link ist oder Seite wechselt
    try {
        var url = new URL(href, location.href);
        if (url.origin === location.origin && url.pathname === location.pathname) return;
    } catch(ex) { return; }

    saveState();

    // Kurzen Toast zeigen
    var toast = $c("div");
    toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1976d2;color:#fff;padding:12px 24px;border-radius:8px;z-index:2147483647;font-family:sans-serif;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.3)";
    toast.textContent = "💡 Klicke auf der nächsten Seite erneut auf das Bookmarklet!";
    document.body.appendChild(toast);

    // Toast nach 2 Sekunden entfernen (falls Seite nicht wechselt)
    window.setTimeout(function() { toast.remove(); }, 2000);
}, true);

// ==========================================
// CLEANUP
// ==========================================

function cleanup() {
    removeHighlight();
    if (panel) {
        panel.remove();
        panel = null;
    }
    document.body.classList.remove("swf-active");
    var welcome = $("#swf-welcome");
    if (welcome) welcome.remove();
    var styles = $("#swf-styles");
    if (styles) styles.remove();
    clearState();
}

// ==========================================
// START
// ==========================================

// Prüfen ob schon aktiv
if (document.getElementById("swf-panel")) {
    // Sidebar existiert schon - nichts tun
    return;
}

injectStyles();
showWelcome();

})();`;

        return 'javascript:' + encodeURIComponent(playerScript);
    }

    // ==========================================
    // Recorder Bookmarklet
    // ==========================================

    function generateRecorderBookmarklet() {
        // Recorder mit sessionStorage-Persistenz und JSON-Download
        var recorderCode = `(function(){
"use strict";

// Storage Keys
var STORAGE_KEY = "swf_recorder_state";

// State laden oder initialisieren
var state;
try {
    var saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
        state = JSON.parse(saved);
        // URL-Wechsel erkennen
        if (state.lastUrl && state.lastUrl !== location.href) {
            state.steps.push({
                type: "navigate",
                trigger: "",
                description: "Seite gewechselt zu: " + location.href,
                url: location.href,
                isEntryPoint: true
            });
        }
    }
} catch(e) {}

if (!state) {
    state = {
        recording: true,
        steps: [],
        startUrl: location.href,
        tutorialName: "Neues Tutorial"
    };
}
state.lastUrl = location.href;

// Bereits aktiv?
if (window._swfRecorderActive && document.getElementById("swf-panel")) {
    return;
}
window._swfRecorderActive = true;

// State speichern
function saveState() {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e) {}
}
saveState();

// Styles
var st = document.createElement("style");
st.id = "swf-rec-styles";
st.textContent = [
    "#swf-panel{position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#2e7d32,#1b5e20);color:#fff;padding:16px 20px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;min-width:280px}",
    "#swf-panel *{box-sizing:border-box}",
    ".swf-hover{outline:3px dashed #2196f3!important;outline-offset:2px}",
    ".swf-recorded{outline:3px solid #4caf50!important;outline-offset:2px;background:rgba(76,175,80,0.1)!important}",
    ".swf-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2e7d32;color:#fff;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:14px;z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,0.3)}",
    ".swf-alt-hint{position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#1976d2;color:#fff;padding:8px 16px;border-radius:6px;font-family:sans-serif;font-size:13px;z-index:2147483647;display:none}",
    ".swf-alt-hint.visible{display:block}"
].join("");
document.head.appendChild(st);

// Text bereinigen: Zeilenumbrüche, mehrfache Leerzeichen, Kürzen
function cleanText(text, maxLen) {
    if (!text) return "";
    maxLen = maxLen || 50;
    return text
        .replace(/[\\r\\n\\t]+/g, " ")  // Zeilenumbrüche zu Leerzeichen
        .replace(/\\s+/g, " ")          // Mehrfache Leerzeichen zusammenfassen
        .trim()
        .substring(0, maxLen);          // Auf max. Länge kürzen
}

// Accessible Name ermitteln
function getAccName(el) {
    if (!el || el.nodeType !== 1) return "";

    // aria-label (hat höchste Priorität)
    var aria = el.getAttribute("aria-label");
    if (aria) return cleanText(aria);

    // aria-labelledby
    var labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
        var label = document.getElementById(labelledBy);
        if (label) return cleanText(label.textContent);
    }

    // Input-Elemente: Label suchen
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
        if (el.id) {
            var lbl = document.querySelector('label[for="' + el.id + '"]');
            if (lbl) return cleanText(lbl.textContent);
        }
        var parentLabel = el.closest("label");
        if (parentLabel) {
            var clone = parentLabel.cloneNode(true);
            var inputs = clone.querySelectorAll("input,select,textarea");
            inputs.forEach(function(i) { i.remove(); });
            var text = clone.textContent.trim();
            if (text) return cleanText(text);
        }
        if (el.placeholder) return cleanText(el.placeholder);
        if (el.name) return cleanText(el.name);
    }

    // Buttons - nur den direkten Text, keine Kinder-Elemente
    if (tag === "BUTTON") {
        // Versuche nur den Text des Buttons selbst zu bekommen
        var btnText = "";
        el.childNodes.forEach(function(node) {
            if (node.nodeType === 3) { // Text node
                btnText += node.textContent;
            }
        });
        btnText = cleanText(btnText);
        if (btnText) return btnText;
        return cleanText(el.textContent) || el.getAttribute("title") || "";
    }

    // Links
    if (tag === "A") {
        var img = el.querySelector("img[alt]");
        if (img) return cleanText(img.alt);
        // Nur den direkten Text
        var linkText = "";
        el.childNodes.forEach(function(node) {
            if (node.nodeType === 3) {
                linkText += node.textContent;
            }
        });
        linkText = cleanText(linkText);
        if (linkText) return linkText;
        return cleanText(el.textContent) || el.getAttribute("title") || "";
    }

    // Allgemein
    return cleanText(el.textContent);
}

// Panel erstellen
var panel = document.createElement("div");
panel.id = "swf-panel";
panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
    '<b>🎬 Aufnahme läuft</b>' +
    '<button id="swf-close" style="background:rgba(255,255,255,0.2);border:none;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:16px">×</button>' +
    '</div>' +
    '<div style="background:rgba(255,255,255,0.15);padding:10px;border-radius:6px;margin-bottom:10px">' +
    '<div style="font-size:13px;font-weight:500">⌨️ Alt gedrückt halten + Klick</div>' +
    '<div style="font-size:11px;opacity:0.8;margin-top:4px">Normale Klicks funktionieren normal</div>' +
    '</div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:10px 12px;border-radius:6px;margin-bottom:12px">' +
    '<span id="swf-count" style="font-size:20px;font-weight:bold">' + state.steps.length + '</span>' +
    '<span style="opacity:0.8"> Schritte aufgezeichnet</span>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<button id="swf-stop" style="flex:1;padding:10px;background:#fff;color:#2e7d32;border:none;border-radius:6px;font-weight:600;cursor:pointer">✓ Fertig & Download</button>' +
    '</div>';
document.body.appendChild(panel);

// Alt-Hinweis
var altHint = document.createElement("div");
altHint.className = "swf-alt-hint";
altHint.textContent = "🎯 Alt gedrückt - jetzt klicken zum Aufzeichnen!";
document.body.appendChild(altHint);

// Alt-Taste Status
var altKeyDown = false;

document.addEventListener("keydown", function(e) {
    if (e.key === "Alt" || e.key === "AltGraph") {
        altKeyDown = true;
        altHint.classList.add("visible");
    }
}, true);

document.addEventListener("keyup", function(e) {
    if (e.key === "Alt" || e.key === "AltGraph") {
        altKeyDown = false;
        altHint.classList.remove("visible");
    }
}, true);

// Bei Fokusverlust Alt zurücksetzen
window.addEventListener("blur", function() {
    altKeyDown = false;
    altHint.classList.remove("visible");
});

// Hover-Effekt nur bei Alt
var lastHover = null;
document.addEventListener("mouseover", function(e) {
    if (e.target.closest("#swf-panel")) return;
    if (lastHover) lastHover.classList.remove("swf-hover");
    if (altKeyDown) {
        e.target.classList.add("swf-hover");
        lastHover = e.target;
    }
}, true);

document.addEventListener("mouseout", function(e) {
    e.target.classList.remove("swf-hover");
}, true);

// Toast anzeigen
function showToast(msg) {
    var toast = document.createElement("div");
    toast.className = "swf-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    var timeout = window.setTimeout(function() {
        toast.remove();
    }, 1500);
}

// Klick-Handler: NUR bei gedrückter Alt-Taste aufzeichnen
document.addEventListener("click", function(e) {
    // Panel ignorieren
    if (e.target.closest("#swf-panel")) return;

    // WICHTIG: Nur aufzeichnen wenn Alt gedrückt
    if (!altKeyDown && !e.altKey) {
        return; // Normaler Klick - nichts tun
    }

    // Alt+Klick: Aufzeichnen
    var el = e.target;

    // Interaktives Element finden
    var interactive = el.closest("button,a,input,select,textarea,[role=button],[role=link],[onclick],[tabindex]");
    if (interactive) el = interactive;

    var name = getAccName(el);
    var desc = name ? 'Klicke auf "' + name + '"' : "Klicke auf das Element";

    state.steps.push({
        type: "click",
        trigger: name,
        description: desc,
        url: location.href,
        isEntryPoint: state.steps.length === 0
    });

    saveState();

    // UI aktualisieren
    var counter = document.getElementById("swf-count");
    if (counter) counter.textContent = state.steps.length;

    // Visuelles Feedback
    el.classList.add("swf-recorded");
    showToast("✓ Schritt " + state.steps.length + ": " + (name || "Element"));

    var timeout2 = window.setTimeout(function() {
        el.classList.remove("swf-recorded");
    }, 2000);

    // Klick NICHT blockieren - Aktion läuft normal weiter
}, true);

// Abbrechen
document.getElementById("swf-close").addEventListener("click", function() {
    if (confirm("Aufnahme abbrechen? Alle Schritte gehen verloren.")) {
        cleanup();
    }
});

// Fertig - JSON herunterladen
document.getElementById("swf-stop").addEventListener("click", function() {
    if (state.steps.length === 0) {
        alert("Keine Schritte aufgenommen.\\n\\nHalte Alt gedrückt und klicke auf Elemente, um Schritte aufzunehmen.");
        return;
    }

    var name = prompt("Tutorial-Name:", state.tutorialName || "Neues Tutorial");
    if (!name) return;

    var tutorial = {
        id: "tutorial_" + Date.now(),
        name: name,
        description: "Erstellt am " + new Date().toLocaleDateString("de-DE"),
        startUrl: state.startUrl,
        steps: state.steps
    };

    // JSON-Datei herunterladen
    var json = JSON.stringify(tutorial, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Tutorial wurde heruntergeladen!\\n\\nÖffne die Tutorial-Werkstatt (index.html) und importiere die JSON-Datei, um ein Bookmarklet zu erstellen.");

    cleanup();
});

function cleanup() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch(e) {}
    panel.remove();
    st.remove();
    altHint.remove();
    window._swfRecorderActive = false;
}

})();`;

        return 'javascript:' + encodeURIComponent(recorderCode);
    }

    // ==========================================
    // Event Listener Setup
    // ==========================================

    function initEventListeners() {
        // Recorder Bookmarklet
        if (elements.recorderBookmarklet) {
            elements.recorderBookmarklet.href = generateRecorderBookmarklet();
        }

        // Neues Tutorial
        if (elements.btnNewTutorial) {
            elements.btnNewTutorial.addEventListener('click', function() {
                elements.newTutorialModal.style.display = 'flex';
                elements.newTutorialName.value = '';
                elements.newTutorialStartUrl.value = '';
                elements.newTutorialName.focus();
            });
        }

        if (elements.btnCloseNewModal) {
            elements.btnCloseNewModal.addEventListener('click', function() {
                elements.newTutorialModal.style.display = 'none';
            });
        }

        if (elements.btnCancelNewTutorial) {
            elements.btnCancelNewTutorial.addEventListener('click', function() {
                elements.newTutorialModal.style.display = 'none';
            });
        }

        if (elements.btnCreateTutorial) {
            elements.btnCreateTutorial.addEventListener('click', function() {
                var name = elements.newTutorialName.value.trim();
                if (!name) {
                    alert('Bitte einen Namen eingeben.');
                    return;
                }

                var tutorial = {
                    id: generateId(),
                    name: name,
                    description: '',
                    startUrl: elements.newTutorialStartUrl.value.trim(),
                    steps: []
                };

                tutorials.push(tutorial);
                saveTutorials();
                renderTutorialList();
                selectTutorial(tutorial.id);

                elements.newTutorialModal.style.display = 'none';
                showToast('Tutorial erstellt', 'success');
            });
        }

        // Tutorial speichern
        if (elements.btnSaveTutorial) {
            elements.btnSaveTutorial.addEventListener('click', function() {
                if (!currentTutorial) return;

                currentTutorial.name = elements.tutorialName.value;
                currentTutorial.description = elements.tutorialDescription.value;
                currentTutorial.startUrl = elements.tutorialStartUrl.value;

                saveTutorials();
                renderTutorialList();
                updateBookmarklet();
                showToast('Tutorial gespeichert', 'success');
            });
        }

        // Tutorial löschen
        if (elements.btnDeleteTutorial) {
            elements.btnDeleteTutorial.addEventListener('click', function() {
                if (currentTutorial) {
                    deleteTutorial(currentTutorial.id);
                }
            });
        }

        // Schritt hinzufügen
        if (elements.btnAddStep) {
            elements.btnAddStep.addEventListener('click', function() {
                openStepModal();
            });
        }

        // Step Modal
        if (elements.btnCloseStepModal) {
            elements.btnCloseStepModal.addEventListener('click', closeStepModal);
        }

        if (elements.btnCancelStep) {
            elements.btnCancelStep.addEventListener('click', closeStepModal);
        }

        if (elements.btnSaveStep) {
            elements.btnSaveStep.addEventListener('click', saveStep);
        }

        if (elements.stepType) {
            elements.stepType.addEventListener('change', updateStepModalFields);
        }

        // Match-Schwellenwert Slider
        if (elements.stepMatchThreshold) {
            elements.stepMatchThreshold.addEventListener('input', function() {
                elements.thresholdValue.textContent = this.value;
            });
        }

        // Bookmarklet kopieren
        if (elements.btnCopyBookmarklet) {
            elements.btnCopyBookmarklet.addEventListener('click', function() {
                if (!elements.generatedBookmarklet.href) return;
                navigator.clipboard.writeText(elements.generatedBookmarklet.href)
                    .then(function() { showToast('Bookmarklet kopiert!', 'success'); })
                    .catch(function() { showToast('Fehler beim Kopieren', 'error'); });
            });
        }

        // Export Tutorial
        if (elements.btnExportTutorial) {
            elements.btnExportTutorial.addEventListener('click', function() {
                if (!currentTutorial) return;
                var json = JSON.stringify(currentTutorial, null, 2);
                var blob = new Blob([json], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = (currentTutorial.name || 'tutorial') + '.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Tutorial exportiert', 'success');
            });
        }

        // Import
        if (elements.btnImport) {
            elements.btnImport.addEventListener('click', function() {
                elements.fileImport.click();
            });
        }

        if (elements.fileImport) {
            elements.fileImport.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var imported = JSON.parse(event.target.result);
                        if (Array.isArray(imported)) {
                            imported.forEach(function(t) {
                                t.id = generateId();
                                tutorials.push(t);
                            });
                        } else {
                            imported.id = generateId();
                            tutorials.push(imported);
                        }
                        saveTutorials();
                        renderTutorialList();
                        showToast('Import erfolgreich', 'success');
                    } catch (err) {
                        showToast('Fehler beim Import', 'error');
                    }
                };
                reader.readAsText(file);
                e.target.value = '';
            });
        }

        // Export All
        if (elements.btnExportAll) {
            elements.btnExportAll.addEventListener('click', function() {
                if (tutorials.length === 0) {
                    showToast('Keine Tutorials zum Exportieren', 'error');
                    return;
                }
                var json = JSON.stringify(tutorials, null, 2);
                var blob = new Blob([json], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'alle-tutorials.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Alle Tutorials exportiert', 'success');
            });
        }

        // Modal Hintergrund-Klick
        if (elements.stepModal) {
            elements.stepModal.addEventListener('click', function(e) {
                if (e.target === elements.stepModal) closeStepModal();
            });
        }

        if (elements.newTutorialModal) {
            elements.newTutorialModal.addEventListener('click', function(e) {
                if (e.target === elements.newTutorialModal) {
                    elements.newTutorialModal.style.display = 'none';
                }
            });
        }
    }

    // ==========================================
    // Initialisierung
    // ==========================================

    function init() {
        loadTutorials();
        renderTutorialList();
        initEventListeners();

        if (tutorials.length > 0) {
            selectTutorial(tutorials[0].id);
        }
    }

    // DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
