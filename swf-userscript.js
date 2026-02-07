// ==UserScript==
// @name         Tutorial-Werkstatt Auto-Loader (Optional)
// @namespace    https://startwithafriend.de/
// @version      1.0
// @description  OPTIONAL: Lädt Tutorial-Werkstatt automatisch auf jeder Seite nach Seitenwechseln. Installation mit Tampermonkey/Greasemonkey.
// @author       Tutorial-Werkstatt
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

/**
 * HINWEIS: Dieses Userscript ist OPTIONAL!
 *
 * Die Bookmarklets funktionieren auch ohne dieses Script.
 * Nach einem Seitenwechsel muss das Bookmarklet einfach erneut geklickt werden -
 * die Session wird automatisch fortgesetzt.
 *
 * Dieses Userscript ist nur für fortgeschrittene Nutzer gedacht, die
 * Tampermonkey/Greasemonkey installiert haben und eine vollautomatische
 * Fortsetzung nach Seitenwechseln wünschen.
 */

(function() {
    'use strict';

    // ==========================================
    // Auto-Loader für Tutorial-Werkstatt
    // ==========================================

    const STORAGE_KEYS = {
        RECORDER_ACTIVE: 'swf_recorder_active',
        RECORDER_STATE: 'swf_recorder_state',
        RECORDER_CONFIG: 'swf_recorder_config',
        RECORDER_CODE: 'swf_recorder_code',
        PLAYER_ACTIVE: 'swf_player_active',
        PLAYER_DATA: 'swf_player_data',
        PLAYER_STEP: 'swf_player_step',
        PLAYER_CODE: 'swf_player_code'
    };

    // Prüfen ob Recorder aktiv ist
    function checkRecorderActive() {
        try {
            const active = sessionStorage.getItem(STORAGE_KEYS.RECORDER_ACTIVE);
            return active === 'true';
        } catch (e) {
            return false;
        }
    }

    // Prüfen ob Player aktiv ist
    function checkPlayerActive() {
        try {
            const active = sessionStorage.getItem(STORAGE_KEYS.PLAYER_ACTIVE);
            return active === 'true';
        } catch (e) {
            return false;
        }
    }

    // Gespeicherten Recorder-State laden
    function loadRecorderState() {
        try {
            const stateJson = sessionStorage.getItem(STORAGE_KEYS.RECORDER_STATE);
            const configJson = sessionStorage.getItem(STORAGE_KEYS.RECORDER_CONFIG);
            return {
                state: stateJson ? JSON.parse(stateJson) : null,
                config: configJson ? JSON.parse(configJson) : null
            };
        } catch (e) {
            console.error('SWF: Fehler beim Laden des Recorder-States:', e);
            return { state: null, config: null };
        }
    }

    // Gespeicherte Player-Daten laden
    function loadPlayerData() {
        try {
            const dataJson = sessionStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
            const step = sessionStorage.getItem(STORAGE_KEYS.PLAYER_STEP);
            return {
                data: dataJson ? JSON.parse(dataJson) : null,
                step: step ? parseInt(step, 10) : 0
            };
        } catch (e) {
            console.error('SWF: Fehler beim Laden der Player-Daten:', e);
            return { data: null, step: 0 };
        }
    }

    // Recorder injizieren und fortsetzen
    function injectRecorder(savedState, savedConfig) {
        console.log('🎬 SWF: Recorder wird fortgesetzt...');

        // Recorder-Code aus sessionStorage laden oder neu injizieren
        const recorderCode = sessionStorage.getItem(STORAGE_KEYS.RECORDER_CODE);
        if (recorderCode) {
            // Code ausführen
            const script = document.createElement('script');
            script.textContent = recorderCode;
            document.head.appendChild(script);

            // State wiederherstellen nach kurzer Verzögerung
            setTimeout(() => {
                if (window._swfRestoreState && savedState) {
                    window._swfRestoreState(savedState, savedConfig);
                }
            }, 100);
        } else {
            console.warn('SWF: Recorder-Code nicht gefunden. Bitte Bookmarklet erneut ausführen.');
            showReloadPrompt('Recorder');
        }
    }

    // Player injizieren und fortsetzen
    function injectPlayer(savedData, savedStep) {
        console.log('▶️ SWF: Player wird fortgesetzt bei Schritt', savedStep + 1);

        // Player-Code aus sessionStorage laden
        const playerCode = sessionStorage.getItem(STORAGE_KEYS.PLAYER_CODE);
        if (playerCode) {
            // Code ausführen
            const script = document.createElement('script');
            script.textContent = playerCode;
            document.head.appendChild(script);

            // Zum richtigen Schritt springen nach kurzer Verzögerung
            setTimeout(() => {
                if (window._swfContinuePlayer && savedData) {
                    window._swfContinuePlayer(savedData, savedStep);
                }
            }, 500); // Etwas länger warten für DOM
        } else {
            console.warn('SWF: Player-Code nicht gefunden. Bitte Bookmarklet erneut ausführen.');
            showReloadPrompt('Player');
        }
    }

    // Hinweis anzeigen wenn Code fehlt
    function showReloadPrompt(type) {
        const prompt = document.createElement('div');
        prompt.id = 'swf-reload-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        prompt.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px;">⚠️ Tutorial-Werkstatt</div>
            <div style="margin-bottom: 12px;">Der ${type} muss neu gestartet werden. Bitte das Bookmarklet erneut ausführen.</div>
            <button id="swf-dismiss-prompt" style="
                background: white;
                color: #e65100;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
            ">OK</button>
        `;
        document.body.appendChild(prompt);

        document.getElementById('swf-dismiss-prompt').addEventListener('click', () => {
            prompt.remove();
            // Session beenden
            sessionStorage.removeItem(STORAGE_KEYS.RECORDER_ACTIVE);
            sessionStorage.removeItem(STORAGE_KEYS.PLAYER_ACTIVE);
        });
    }

    // ==========================================
    // Initialisierung
    // ==========================================

    function init() {
        // Kurz warten bis DOM bereit
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Prüfen ob Recorder aktiv
        if (checkRecorderActive()) {
            const { state, config } = loadRecorderState();
            if (state) {
                injectRecorder(state, config);
            }
            return;
        }

        // Prüfen ob Player aktiv
        if (checkPlayerActive()) {
            const { data, step } = loadPlayerData();
            if (data) {
                injectPlayer(data, step);
            }
            return;
        }

        // Nichts aktiv - still beenden
        // console.log('SWF: Keine aktive Session gefunden.');
    }

    // Starten
    init();

})();
