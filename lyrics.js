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

    // Cache line elements once per render instead of re-querying the DOM
    // on every `timeupdate` tick (fires up to ~60x/sec in some browsers).
    let cachedLyricElements = [];

    const LRC_FETCH_TIMEOUT_MS = 8000;
    const MAX_FADE_DISTANCE = 4;

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

            // Skip pure metadata tags like [ar:], [ti:], [al:], [offset:]
            // that don't carry a timestamp we can use.
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
       Toast (lightweight error notification)
       ========================================================= */

    let toastTimeoutId = null;

    const showToast = (message) => {

        let toastEl = document.querySelector('.toast');

        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            toastEl.setAttribute('role', 'status');
            toastEl.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastEl);
        }

        toastEl.textContent = message;
        toastEl.classList.add('visible');

        clearTimeout(toastTimeoutId);
        toastTimeoutId = setTimeout(() => {
            toastEl.classList.remove('visible');
        }, 3500);
    };

    window.showToast = showToast;


    /* =========================================================
       Load LRC File (with timeout)
       ========================================================= */

    const loadLyrics = async (track) => {

        if (!track?.lyrics) {
            return null;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            LRC_FETCH_TIMEOUT_MS
        );

        try {

            const response = await fetch(
                track.lyrics,
                {
                    cache: 'no-cache',
                    signal: controller.signal
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

            if (error.name === 'AbortError') {
                console.error(
                    `Timed out loading lyrics for "${track.title}"`
                );
                showToast('Lyrics took too long to load.');
            } else {
                console.error(
                    `Failed to load lyrics for "${track.title}"`,
                    error
                );
                showToast('Couldn\u2019t load lyrics for this track.');
            }

            return null;

        } finally {
            clearTimeout(timeoutId);
        }
    };


    /* =========================================================
       Render Loading State (skeleton)
       ========================================================= */

    const renderLoadingState = () => {

        if (!lyricsView) {
            return;
        }

        cachedLyricElements = [];

        lyricsView.innerHTML = `
            <div class="lyrics-skeleton" aria-hidden="true">
                <div class="lyrics-skeleton-bar w2"></div>
                <div class="lyrics-skeleton-bar w1"></div>
                <div class="lyrics-skeleton-bar w3"></div>
                <div class="lyrics-skeleton-bar w4"></div>
            </div>
            <p class="lyrics-hint" style="text-align:center;">Loading lyrics&hellip;</p>
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
                    No synced lyrics for this track yet.
                </p>
            </div>
        `;


        currentSyncedLyrics = null;

        activeLyricsLineIndex = -1;

        cachedLyricElements = [];

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

                <div class="lyrics-lines" role="region" aria-label="Synced lyrics" aria-live="off">

                    ${lyrics.map(
                        (line, index) => `
                            <p
                                class="lyrics-line"
                                data-index="${index}"
                                role="button"
                                tabindex="0"
                                aria-label="Jump to lyric: ${escapeHtml(line.text)}"
                            >
                                ${escapeHtml(line.text)}
                            </p>
                        `
                    ).join('')}

                </div>

            </div>
        `;

        // Cache the line elements once per render.
        cachedLyricElements = Array.from(
            lyricsView.querySelectorAll('.lyrics-line')
        );

        // Tap-to-seek: click or keyboard-activate a line to jump there.
        cachedLyricElements.forEach((element, index) => {

            const jumpToLine = () => {
                if (typeof audio === 'undefined' || !audio) return;
                audio.currentTime = lyrics[index].time;
                if (audio.paused) {
                    audio.play().catch(() => {
                        /* ignore autoplay rejection here; user just clicked */
                    });
                }
                updateActiveLyricLine();
            };

            element.addEventListener('click', jumpToLine);

            element.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    jumpToLine();
                }
            });

        });

        updateActiveLyricLine();

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

            cachedLyricElements = [];

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


        if (!cachedLyricElements.length) {
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
         * Update active class + distance-based fade/blur,
         * so lines further from the active one recede visually
         * (Spotify/Apple Music style karaoke feel).
         */

        cachedLyricElements.forEach(
            (element, index) => {

                const isActive = index === activeIndex;

                element.classList.toggle('active', isActive);

                if (isActive) {
                    element.style.opacity = '';
                    element.style.filter = '';
                    return;
                }

                const distance = activeIndex < 0
                    ? 1
                    : Math.abs(index - activeIndex);

                const clampedDistance = Math.min(distance, MAX_FADE_DISTANCE);
                const opacity = Math.max(0.18, 1 - clampedDistance * 0.22);
                const blur = Math.min(clampedDistance, 3) * 0.5;

                element.style.opacity = String(opacity);
                element.style.filter = blur > 0 ? `blur(${blur}px)` : '';

            }
        );


        /*
         * Auto-scroll active lyric to the center of the lyrics
         * panel, calculated manually via offsets rather than
         * scrollIntoView() — more reliable across mobile Safari
         * with nested scroll containers.
         */

        if (
            activeIndex >= 0 &&
            cachedLyricElements[activeIndex]
        ) {

            const activeElement = cachedLyricElements[activeIndex];
            const container = lyricsView.querySelector('.lyrics-lines');

            if (container) {
                const targetScroll =
                    activeElement.offsetTop -
                    (container.clientHeight / 2) +
                    (activeElement.clientHeight / 2);

                container.scrollTo({
                    top: Math.max(0, targetScroll),
                    behavior: 'smooth'
                });
            }

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

        cachedLyricElements = [];


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
            'Show lyrics for the current song'
        );

        button.setAttribute('aria-pressed', 'false');


        button.innerHTML =
            '<i class="fas fa-align-left" aria-hidden="true"></i>';


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

        lyricsViewElement.setAttribute('aria-live', 'off');


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

                const nowActive = !showingLyrics;

                button.classList.toggle(
                    'active',
                    nowActive
                );

                button.setAttribute('aria-pressed', String(nowActive));
                button.setAttribute(
                    'aria-label',
                    nowActive ? 'Hide lyrics' : 'Show lyrics for the current song'
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