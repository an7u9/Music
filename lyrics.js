/* =====================================================================
   PINK BEATS — LYRICS MODULE
   Fully self-contained. Load this AFTER scripts.js.

   Depends on these globals already defined in scripts.js:
     - audio                (the <audio> element)
     - playlists             (the playlists data object)
     - currentTrackIndex     (index of the playing track)
     - currentPlaylistName   (name of the playing playlist)
     - getPlaylistTracks(name) (resolves a playlist name to a track array,
                                 including the virtual "all" playlist)

   Adds:
     - A lyrics toggle button on the right side of the sidebar nav
     - A lyrics panel that swaps in for the track list
     - Three modes: paste lyrics -> manual tag -> auto-scrolling sync view
     - LRC ([mm:ss.xx]text) auto-detection for instant sync, no tagging
     - Optional permanent lyrics: add `lrc: "..."` to any track object in
       `playlists` and it'll be used for every visitor automatically.
   ===================================================================== */

// (() => {
//     const LYRICS_RAW_PREFIX = 'pb_lyrics_raw:';
//     const LYRICS_TIMED_PREFIX = 'pb_lyrics_timed:';

//     let lyricsView = null;          // the injected lyrics panel element
//     let currentSyncedLyrics = null; // cached timed lyrics for the loaded track
//     let activeLyricsLineIndex = -1;
//     let lastObservedSrc = null;     // used to detect track changes without
//     // needing any hook inside scripts.js

//     // ---------- storage helpers (per-browser, keyed by track URL) ----------
//     const trackKey = (track) => new URL(track.src, window.location.href).href;

//     const getStoredLyricsRaw = (key) => localStorage.getItem(LYRICS_RAW_PREFIX + key);
//     const setStoredLyricsRaw = (key, text) => localStorage.setItem(LYRICS_RAW_PREFIX + key, text);
//     const getStoredLyricsTimed = (key) => {
//         const raw = localStorage.getItem(LYRICS_TIMED_PREFIX + key);
//         return raw ? JSON.parse(raw) : null;
//     };
//     const setStoredLyricsTimed = (key, arr) => localStorage.setItem(LYRICS_TIMED_PREFIX + key, JSON.stringify(arr));

//     const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (ch) => ({
//         '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
//     }[ch]));

//     // ---------- LRC parsing ----------
//     // Parses standard LRC format: [mm:ss.xx]lyric text (one or more
//     // timestamps per line are supported). Lines with no timestamp, or a
//     // timestamp with no text after it (instrumental breaks), are skipped.
//     const LRC_TAG_REGEX = /\[(\d{2}):(\d{2})(?:[.:](\d{1,2}))?\]/g;

//     const parseLrc = (text) => {
//         const result = [];
//         text.split('\n').forEach(line => {
//             const tags = [...line.matchAll(LRC_TAG_REGEX)];
//             if (!tags.length) return;
//             const content = line.replace(LRC_TAG_REGEX, '').trim();
//             if (!content) return;
//             tags.forEach(m => {
//                 const minutes = parseInt(m[1], 10);
//                 const seconds = parseInt(m[2], 10);
//                 const frac = m[3] ? parseFloat('0.' + m[3]) : 0;
//                 result.push({ time: minutes * 60 + seconds + frac, text: content });
//             });
//         });
//         return result.sort((a, b) => a.time - b.time);
//     };

//     // ---------- current track lookup ----------
//     const getCurrentTrack = () => {
//         if (typeof currentTrackIndex !== 'number' || currentTrackIndex === null || !currentPlaylistName) return null;
//         const list = playlists[currentPlaylistName] || [];
//         return list[currentTrackIndex] || null;
//     };

//     // ---------- Mode 1: paste lyrics (plain text or LRC) ----------
//     const renderLyricsPasteForm = (key, prefill = '') => {
//         lyricsView.innerHTML = `
//       <div class="lyrics-empty">
//         <p class="lyrics-hint">Paste lyrics below — plain text, or LRC format with <code>[mm:ss.xx]</code> timestamps for instant sync.</p>
//         <textarea id="lyrics-paste" class="lyrics-textarea" placeholder="Paste lyrics here...">${escapeHtml(prefill)}</textarea>
//         <button id="lyrics-save-raw" class="lyrics-btn primary">Continue</button>
//       </div>
//     `;
//         document.getElementById('lyrics-save-raw').addEventListener('click', () => {
//             const text = document.getElementById('lyrics-paste').value.trim();
//             if (!text) return;

//             // Keep the original text so "Edit Lyrics" can reopen it later.
//             setStoredLyricsRaw(key, text);

//             const timed = parseLrc(text);
//             if (timed.length) {
//                 setStoredLyricsTimed(timed);
//                 renderLyricsSyncView(timed);
//                 return;
//             }

//             renderLyricsTaggingView(key, text.split('\n').filter(l => l.trim().length));
//         });
//     };

//     // ---------- Mode 2: manual tagging ----------
//     const renderLyricsTaggingView = (key, lines) => {
//         let tagIndex = 0;
//         const timestamps = [];

//         lyricsView.innerHTML = `
//       <div class="lyrics-tagger">
//         <p class="lyrics-hint">Play the song, then tap <strong>Tag Line</strong> the instant each line starts.</p>
//         <div class="lyrics-tag-list">
//           ${lines.map((l, i) => `<div class="lyrics-tag-line" data-i="${i}">${escapeHtml(l)}</div>`).join('')}
//         </div>
//         <div class="lyrics-tag-controls">
//           <button id="lyrics-restart" class="lyrics-btn secondary">Restart</button>
//           <button id="lyrics-tag-btn" class="lyrics-btn primary">Tag Line</button>
//           <button id="lyrics-undo" class="lyrics-btn secondary">Undo</button>
//         </div>
//       </div>
//     `;

//         const lineEls = lyricsView.querySelectorAll('.lyrics-tag-line');
//         const highlight = () => {
//             lineEls.forEach((el, i) => el.classList.toggle('current', i === tagIndex));
//             if (lineEls[tagIndex]) lineEls[tagIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
//         };
//         highlight();

//         document.getElementById('lyrics-tag-btn').addEventListener('click', () => {
//             if (tagIndex >= lines.length) return;
//             timestamps[tagIndex] = audio.currentTime || 0;
//             lineEls[tagIndex].classList.add('tagged');
//             tagIndex++;
//             if (tagIndex >= lines.length) {
//                 const timed = lines.map((text, i) => ({ time: timestamps[i] ?? 0, text }));
//                 setStoredLyricsTimed(key, timed);
//                 renderLyricsSyncView(key, timed);
//                 return;
//             }
//             highlight();
//         });

//         document.getElementById('lyrics-undo').addEventListener('click', () => {
//             if (tagIndex === 0) return;
//             tagIndex--;
//             lineEls[tagIndex].classList.remove('tagged');
//             highlight();
//         });

//         document.getElementById('lyrics-restart').addEventListener('click', () => {
//             tagIndex = 0;
//             timestamps.length = 0;
//             lineEls.forEach(el => el.classList.remove('tagged'));
//             highlight();
//         });
//     };

//     // ---------- Mode 3: synced karaoke view ----------
//     const renderLyricsSyncView = (timed) => {
//         currentSyncedLyrics = timed;
//         activeLyricsLineIndex = -1;
//         lyricsView.innerHTML = `
//   <div class="lyrics-sync">
//     <div class="lyrics-lines">
//       ${timed.map((l, i) =>
//             `<p class="lyrics-line" data-i="${i}">${escapeHtml(l.text)}</p>`
//         ).join("")}
//     </div>
//   </div>
// `;
//         document.getElementById('lyrics-edit').addEventListener('click', () => {
//             renderLyricsPasteForm(key, getStoredLyricsRaw(key) || timed.map(l => l.text).join('\n'));
//         });
//         document.getElementById('lyrics-retag').addEventListener('click', () => {
//             renderLyricsTaggingView(key, timed.map(l => l.text));
//         });
//     };

//     // ---------- mode dispatcher ----------
//     // Priority: a manual override saved in this browser > lyrics shipped
//     // permanently with the track data (track.lrc) > mid-tagging draft > blank form.
//     const refreshLyricsView = () => {
//         if (!lyricsView) return;

//         const track = getCurrentTrack();

//         if (!track) {
//             lyricsView.innerHTML =
//                 `<p class="lyrics-hint">No song is playing.</p>`;
//             currentSyncedLyrics = null;
//             return;
//         }

//         if (!track.lyrics) {
//             lyricsView.innerHTML =
//                 `<p class="lyrics-hint">Lyrics not available.</p>`;
//             currentSyncedLyrics = null;
//             return;
//         }

//         const timed = parseLrc(track.lyrics);

//         if (!timed.length) {
//             lyricsView.innerHTML =
//                 `<p class="lyrics-hint">Invalid LRC format.</p>`;
//             currentSyncedLyrics = null;
//             return;
//         }

//         renderLyricsSyncView(timed);
//     };

//     const isLyricsTabActive = () =>
//         document.querySelector('.lyrics-toggle-btn')?.classList.contains('active');

//     // ---------- playback sync ----------
//     const updateActiveLyricLine = () => {
//         if (!currentSyncedLyrics || !lyricsView) return;
//         const lines = lyricsView.querySelectorAll('.lyrics-line');
//         if (!lines.length) return;

//         let idx = -1;
//         for (let i = 0; i < currentSyncedLyrics.length; i++) {
//             if (audio.currentTime >= currentSyncedLyrics[i].time) idx = i; else break;
//         }
//         if (idx === activeLyricsLineIndex) return;
//         activeLyricsLineIndex = idx;
//         lines.forEach((el, i) => el.classList.toggle('active', i === idx));
//         if (idx >= 0 && lines[idx]) {
//             lines[idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
//         }
//     };

//     // Detects a track change purely by watching audio.currentSrc, so this
//     // file never needs to be called into from scripts.js.
//     const checkForTrackChange = () => {
//         if (audio.currentSrc !== lastObservedSrc) {
//             lastObservedSrc = audio.currentSrc;
//             if (isLyricsTabActive()) refreshLyricsView();
//         }
//     };

//     // ---------- injection ----------
//     const injectLyricsToggle = () => {
//         const playlistEl = document.getElementById("playlist");

//         if (!playlistEl || document.querySelector(".lyrics-toggle-btn")) return;

//         const btn = document.createElement("button");
//         btn.className = "lyrics-toggle-btn";
//         btn.setAttribute("aria-label", "Toggle lyrics for the current song");
//         btn.innerHTML = '<i class="fas fa-align-left"></i>';

//         // Add directly to the body instead of the sidebar
//         document.body.appendChild(btn);

//         const lyricsViewEl = document.createElement("div");
//         lyricsViewEl.id = "lyrics-view";
//         lyricsViewEl.className = "lyrics-view hidden";
//         playlistEl.insertAdjacentElement("afterend", lyricsViewEl);
//         lyricsView = lyricsViewEl;

//         btn.addEventListener("click", () => {
//             const isShowingLyrics = !lyricsViewEl.classList.contains("hidden");

//             playlistEl.classList.toggle("hidden", !isShowingLyrics);
//             lyricsViewEl.classList.toggle("hidden", isShowingLyrics);
//             btn.classList.toggle("active", !isShowingLyrics);

//             if (!isShowingLyrics) {
//                 refreshLyricsView();
//             }
//         });
//     };

//     window.addEventListener('load', injectLyricsToggle);
//     audio.addEventListener('timeupdate', () => {
//         checkForTrackChange();
//         updateActiveLyricLine();
//     });
//     audio.addEventListener('play', checkForTrackChange);

//     window.refreshLyricsView = refreshLyricsView;
//     window.updateActiveLyricLine = updateActiveLyricLine;
//     window.isLyricsTabActive = isLyricsTabActive;
//     window.injectLyricsTabs = injectLyricsToggle;
// })();

(() => {
    'use strict';
    /* =========================================================
       State
       ========================================================= */

    let lyricsView = null;
    let currentSyncedLyrics = null;
    let activeLyricsLineIndex = -1;
    let lastObservedSrc = null;
    let lyricsRequestId = 0;

    const LRC_TAG_REGEX =
        /\[(\d{2}):(\d{2})(?:[.:](\d{1,2}))?\]/g;


    const parseLrc = (text) => {

        if (
            !text ||
            typeof text !== 'string'
        ) {
            return [];
        }


        const lyrics = [];

        const lines =
            text.split(/\r?\n/);


        lines.forEach((line) => {

            const timestamps = [
                ...line.matchAll(LRC_TAG_REGEX)
            ];


            if (!timestamps.length) {
                return;
            }

            const lyricText = line
                .replace(LRC_TAG_REGEX, '')
                .trim();

            if (!lyricText) {
                return;
            }

            timestamps.forEach((match) => {

                const minutes =
                    parseInt(match[1], 10);

                const seconds =
                    parseInt(match[2], 10);

                const fraction = match[3]
                    ? parseFloat(`0.${match[3]}`)
                    : 0;


                lyrics.push({
                    time:
                        minutes * 60 +
                        seconds +
                        fraction,

                    text: lyricText
                });

            });

        });

        return lyrics.sort(
            (a, b) => a.time - b.time
        );
    };


    /* =========================================================
       Get Current Track
       ========================================================= */

    const getCurrentTrack = () => {
        if (
            typeof currentTrackIndex !== 'number' ||
            !currentPlaylistName
        ) {
            return null;
        }


        const playlist =
            playlists[currentPlaylistName];


        if (!Array.isArray(playlist)) {
            return null;
        }


        return (
            playlist[currentTrackIndex] ||
            null
        );
    };


    /* =========================================================
       HTML Escape
       ========================================================= */

    const escapeHtml = (text) => {

        return String(text).replace(
            /[&<>"']/g,
            (character) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]
        );

    };


    /* =========================================================
       Load LRC File
       ========================================================= */

    const loadLyrics = async (track) => {

        if (!track?.lyrics) {
            return null;
        }


        try {

            const response = await fetch(
                track.lyrics,
                {
                    cache: 'no-cache'
                }
            );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const lrcText =
                await response.text();


            const parsedLyrics =
                parseLrc(lrcText);


            if (!parsedLyrics.length) {

                console.warn(
                    `No valid lyrics found for "${track.title}"`
                );

                return null;
            }


            return parsedLyrics;

        } catch (error) {

            console.error(
                `Failed to load lyrics for "${track.title}"`,
                error
            );

            return null;
        }
    };


    /* =========================================================
       Render Loading State
       ========================================================= */

    const renderLoadingState = () => {

        if (!lyricsView) {
            return;
        }


        lyricsView.innerHTML = `
            <div class="lyrics-empty">
                <p class="lyrics-hint">
                    Loading lyrics...
                </p>
            </div>
        `;

    };


    /* =========================================================
       Render No Lyrics
       ========================================================= */

    const renderNoLyrics = () => {

        if (!lyricsView) {
            return;
        }


        lyricsView.innerHTML = `
            <div class="lyrics-empty">
                <p class="lyrics-hint">
                    Lyrics not available.
                </p>
            </div>
        `;


        currentSyncedLyrics = null;

        activeLyricsLineIndex = -1;

    };


    /* =========================================================
       Render Lyrics
       ========================================================= */

    const renderLyrics = (lyrics) => {

        if (!lyricsView) {
            return;
        }


        if (!lyrics?.length) {

            renderNoLyrics();

            return;
        }


        currentSyncedLyrics = lyrics;

        activeLyricsLineIndex = -1;


        lyricsView.innerHTML = `
            <div class="lyrics-sync">

                <div class="lyrics-lines">

                    ${lyrics.map(
            (line, index) => `
                            <p
                                class="lyrics-line"
                                data-index="${index}"
                            >
                                ${escapeHtml(line.text)}
                            </p>
                        `
        ).join('')}

                </div>

            </div>
        `;

        // in renderLyrics, after building innerHTML
        lyricsView.querySelectorAll('.lyrics-line').forEach((el, i) => {
            el.addEventListener('click', () => {
                audio.currentTime = lyrics[i].time;
                updateActiveLyricLine();
            });
        });
        // updateActiveLyricLine();

    };


    /* =========================================================
       Refresh Lyrics
       ========================================================= */

    const refreshLyricsView = async () => {

        if (!lyricsView) {
            return;
        }


        const track =
            getCurrentTrack();


        /*
         * No current track.
         */

        if (!track) {

            lyricsView.innerHTML = `
                <div class="lyrics-empty">
                    <p class="lyrics-hint">
                        No song is playing.
                    </p>
                </div>
            `;

            currentSyncedLyrics = null;

            activeLyricsLineIndex = -1;

            return;
        }


        /*
         * Current song does not have lyrics.
         */

        if (!track.lyrics) {

            renderNoLyrics();

            return;
        }


        /*
         * Show loading state.
         */

        renderLoadingState();


        /*
         * Generate a request ID.
         *
         * If the user changes songs while fetch()
         * is running, the old request will be ignored.
         */

        const requestId =
            ++lyricsRequestId;


        const lyrics =
            await loadLyrics(track);


        /*
         * Ignore stale request.
         */

        if (
            requestId !== lyricsRequestId
        ) {
            return;
        }


        /*
         * Make sure the same track is
         * still selected.
         */

        const currentTrack =
            getCurrentTrack();


        if (
            !currentTrack ||
            currentTrack !== track
        ) {
            return;
        }


        /*
         * Render lyrics.
         */

        if (!lyrics?.length) {

            renderNoLyrics();

            return;
        }


        renderLyrics(lyrics);

    };


    /* =========================================================
       Find Active Lyric
       ========================================================= */

    const findActiveLyricIndex = (
        currentTime
    ) => {

        if (
            !currentSyncedLyrics?.length
        ) {
            return -1;
        }


        let activeIndex = -1;


        /*
         * Find the last lyric whose timestamp
         * is less than or equal to current time.
         */

        for (
            let index = 0;
            index < currentSyncedLyrics.length;
            index++
        ) {

            if (
                currentTime >=
                currentSyncedLyrics[index].time
            ) {

                activeIndex = index;

            } else {

                break;

            }

        }


        return activeIndex;
    };


    /* =========================================================
       Update Active Lyric
       ========================================================= */

    const updateActiveLyricLine = () => {

        if (
            !currentSyncedLyrics ||
            !lyricsView
        ) {
            return;
        }


        const lyricElements =
            lyricsView.querySelectorAll(
                '.lyrics-line'
            );


        if (!lyricElements.length) {
            return;
        }


        const currentTime =
            audio.currentTime || 0;


        const activeIndex =
            findActiveLyricIndex(
                currentTime
            );


        /*
         * If the active line hasn't changed,
         * don't update the DOM or scroll again.
         */

        if (
            activeIndex ===
            activeLyricsLineIndex
        ) {
            return;
        }


        activeLyricsLineIndex =
            activeIndex;


        /*
         * Update active class.
         */

        lyricElements.forEach((el, index) => {
            const distance = Math.abs(index - activeIndex);
            el.classList.toggle('active', index === activeIndex);
            el.style.opacity = distance === 0 ? 1 : Math.max(0.45, 1 - distance * 0.2);
            el.style.filter = distance === 0 ? 'blur(0px)' : `blur(${Math.min(distance, 3) * 0.3}px)`;
        });

        /*
         * Auto-scroll active lyric
         * to the center of the lyrics panel.
         */


        if (activeIndex >= 0 && lyricElements[activeIndex]) {
            const el = lyricElements[activeIndex];
            const container = lyricsView.querySelector('.lyrics-lines');
            const targetScroll = el.offsetTop - (container.clientHeight / 2) + (el.clientHeight / 2);
            container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }

    };


    /* =========================================================
       Lyrics Toggle State
       ========================================================= */

    const isLyricsTabActive = () => {

        const button =
            document.querySelector(
                '.lyrics-toggle-btn'
            );


        return Boolean(
            button?.classList.contains('active')
        );

    };


    /* =========================================================
       Detect Track Change
       ========================================================= */

    const checkForTrackChange = () => {

        const currentSrc =
            audio.currentSrc;


        /*
         * Nothing changed.
         */

        if (
            currentSrc === lastObservedSrc
        ) {
            return;
        }


        /*
         * Store new source.
         */

        lastObservedSrc =
            currentSrc;


        /*
         * Clear previous song's lyrics.
         */

        currentSyncedLyrics = null;

        activeLyricsLineIndex = -1;


        /*
         * Load lyrics only when the
         * lyrics panel is visible.
         */

        if (isLyricsTabActive()) {

            refreshLyricsView();

        }

    };


    /* =========================================================
       Lyrics Toggle Button
       ========================================================= */

    const injectLyricsToggle = () => {

        const playlistElement =
            document.getElementById(
                'playlist'
            );


        /*
         * Don't create another button
         * if one already exists.
         */

        if (
            !playlistElement ||
            document.querySelector(
                '.lyrics-toggle-btn'
            )
        ) {
            return;
        }


        /* -----------------------------------------------------
           Create Toggle Button
           ----------------------------------------------------- */

        const button =
            document.createElement(
                'button'
            );


        button.className =
            'lyrics-toggle-btn';


        button.setAttribute(
            'aria-label',
            'Toggle lyrics for the current song'
        );


        button.innerHTML =
            '<i class="fas fa-align-left"></i>';


        document.body.appendChild(
            button
        );


        /* -----------------------------------------------------
           Create Lyrics Container
           ----------------------------------------------------- */

        const lyricsViewElement =
            document.createElement(
                'div'
            );


        lyricsViewElement.id =
            'lyrics-view';


        lyricsViewElement.className =
            'lyrics-view hidden';


        /*
         * Place lyrics directly after playlist,
         * preserving your existing layout.
         */

        playlistElement
            .insertAdjacentElement(
                'afterend',
                lyricsViewElement
            );


        lyricsView =
            lyricsViewElement;


        /* -----------------------------------------------------
           Toggle Handler
           ----------------------------------------------------- */

        button.addEventListener(
            'click',
            () => {

                const showingLyrics =
                    !lyricsViewElement
                        .classList
                        .contains('hidden');


                /*
                 * Playlist visibility.
                 */

                playlistElement
                    .classList
                    .toggle(
                        'hidden',
                        !showingLyrics
                    );


                /*
                 * Lyrics visibility.
                 */

                lyricsViewElement
                    .classList
                    .toggle(
                        'hidden',
                        showingLyrics
                    );


                /*
                 * Button active state.
                 */

                button.classList.toggle(
                    'active',
                    !showingLyrics
                );


                /*
                 * Load lyrics when opening
                 * the lyrics panel.
                 */

                if (!showingLyrics) {

                    refreshLyricsView();

                }

            }
        );

    };


    /* =========================================================
       Audio Events
       ========================================================= */

    /*
     * Main synchronization loop.
     */

    audio.addEventListener(
        'timeupdate',
        () => {

            checkForTrackChange();

            updateActiveLyricLine();

        }
    );


    /*
     * Handles a new song starting.
     */

    audio.addEventListener(
        'play',
        () => {

            checkForTrackChange();

            updateActiveLyricLine();

        }
    );


    /*
     * Handles seeking.
     *
     * Example:
     *
     * 01:10 -> user seeks to 02:30
     *
     * The correct lyric immediately becomes active.
     */

    audio.addEventListener(
        'seeked',
        () => {

            updateActiveLyricLine();

        }
    );


    /* =========================================================
       Initialization
       ========================================================= */

    window.addEventListener(
        'load',
        () => {

            injectLyricsToggle();

        }
    );


    /* =========================================================
       Public API
       ========================================================= */

    /*
     * Expose only what scripts.js may need.
     */

    window.refreshLyricsView =
        refreshLyricsView;

    window.updateActiveLyricLine =
        updateActiveLyricLine;

    window.isLyricsTabActive =
        isLyricsTabActive;

    window.injectLyricsTabs =
        injectLyricsToggle;

})();
