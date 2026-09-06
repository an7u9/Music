(() => {
    'use strict';

    // ---- state ----
    let lyricsView = null;          // container element for the lyrics panel
    let syncedLyrics = null;        // parsed [{ time, text }] for the current track
    let activeIndex = -1;           // index of the currently active lyric line
    let lastSrc = null;             // last audio src seen, used to detect track changes
    let requestId = 0;              // guards against a slow fetch overwriting a newer one
    let lineEls = [];               // cached DOM nodes for lyric lines (avoid re-querying every tick)

    const LRC_TAG = /\[(\d{2}):(\d{2})(?:[.:](\d{1,2}))?\]/g;
    const FETCH_TIMEOUT_MS = 8000;

    // Parses raw .lrc text into a time-sorted [{ time, text }] array.
    // Ignores metadata-only tags (e.g. [ar:], [ti:]) with no timestamp.
    const parseLrc = (text) => {
        if (!text) return [];
        const out = [];
        text.split(/\r?\n/).forEach((line) => {
            const stamps = [...line.matchAll(LRC_TAG)];
            if (!stamps.length) return;
            const content = line.replace(LRC_TAG, '').trim();
            if (!content) return;
            stamps.forEach((m) => {
                const time = (+m[1]) * 60 + (+m[2]) + (m[3] ? +('0.' + m[3]) : 0);
                out.push({ time, text: content });
            });
        });
        return out.sort((a, b) => a.time - b.time);
    };

    // Resolves the track object that's currently loaded in the player.
    const getCurrentTrack = () => {
        const list = playlists[currentPlaylistName];
        if (!Array.isArray(list) || typeof currentTrackIndex !== 'number') return null;
        return list[currentTrackIndex] || null;
    };

    // Escapes user/lyric text before injecting it as HTML.
    const escapeHtml = (str) =>
        String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

    // Fetches and parses the .lrc file for a track, with a hard timeout
    // so a hung request doesn't leave the panel stuck on "Loading...".
    const loadLyrics = async (track) => {
        if (!track?.lyrics) return null;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(track.lyrics, { cache: 'no-cache', signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return parseLrc(await res.text());
        } catch (err) {
            console.error(`Lyrics load failed for "${track.title}":`, err);
            return null;
        } finally {
            clearTimeout(timer);
        }
    };

    // Renders a single centered message into the lyrics panel
    // (used for loading / empty / no-track states).
    const showMessage = (text) => {
        lineEls = [];
        lyricsView.innerHTML = `<p class="lyrics-hint" style="text-align:center;">${text}</p>`;
    };

    // Renders the synced lyric lines and wires click-to-seek on each one.
    const renderLyrics = (lyrics) => {
        syncedLyrics = lyrics;
        activeIndex = -1;

        lyricsView.innerHTML = `
      <div class="lyrics-sync">
        <div class="lyrics-lines" role="region" aria-label="Synced lyrics">
          ${lyrics.map((l, i) => `
           <p class="lyrics-line" data-index="${i}" role="button" tabindex="0">
  <span class="lyrics-text">${escapeHtml(l.text)}</span>
</p>`).join('')}
        </div>
      </div>`;

        lineEls = Array.from(lyricsView.querySelectorAll('.lyrics-line'));

        // Tap or Enter/Space on a line seeks the song to that timestamp.
        lineEls.forEach((el, i) => {
            const jump = () => {
                audio.currentTime = lyrics[i].time;
                if (audio.paused) audio.play().catch(() => { });
            };
            el.addEventListener('click', jump);
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); }
            });
        });

        updateActiveLine();
    };

    // Top-level orchestrator: figures out what to show for the current
    // track (no track / no lyrics / loading / rendered) and fetches as needed.
    const refreshLyricsView = async () => {
        if (!lyricsView) return;
        const track = getCurrentTrack();

        if (!track) { syncedLyrics = null; lineEls = []; showMessage('No song is playing.'); return; }
        if (!track.lyrics) { syncedLyrics = null; lineEls = []; showMessage('No synced lyrics for this track.'); return; }

        showMessage('Loading lyrics&hellip;');
        const myRequest = ++requestId;

        const lyrics = await loadLyrics(track);

        // Bail out if the user switched tracks while this fetch was in flight.
        if (myRequest !== requestId || getCurrentTrack() !== track) return;

        if (!lyrics?.length) { showMessage('No synced lyrics for this track.'); return; }
        renderLyrics(lyrics);
    };

    // Finds the last lyric line whose timestamp has passed.
    const findActiveIndex = (time) => {
        let idx = -1;
        for (const line of syncedLyrics || []) {
            if (time >= line.time) idx++; else break;
        }
        return idx;
    };

    // Marks the active line (triggers its zoom + color CSS via `.active`),
    // and keeps it vertically centered in the panel as playback progresses.
    const updateActiveLine = () => {
        if (!syncedLyrics || !lineEls.length) return;

        const idx = findActiveIndex(audio.currentTime || 0);
        if (idx === activeIndex) return;
        activeIndex = idx;

        lineEls.forEach((el, i) => el.classList.toggle('active', i === idx));

        const el = lineEls[idx];
        const container = lyricsView.querySelector('.lyrics-lines');
        if (el && container) {
            container.scrollTo({
                top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
                behavior: 'smooth'
            });
        }
    };

    // Whether the lyrics tab (vs. the playlist tab) is currently visible.
    const isLyricsTabActive = () =>
        Boolean(document.querySelector('.lyrics-toggle-btn')?.classList.contains('active'));

    // Detects when the loaded track changes and refreshes the panel if visible.
    const checkTrackChange = () => {
        if (audio.currentSrc === lastSrc) return;
        lastSrc = audio.currentSrc;
        syncedLyrics = null;
        lineEls = [];
        if (isLyricsTabActive()) refreshLyricsView();
    };

    // Builds the lyrics tab toggle button + panel, and wires the tab
    // navigation between the playlist view and the lyrics view.
    const injectLyricsToggle = () => {
        const playlistEl = document.getElementById('playlist');
        if (!playlistEl || document.querySelector('.lyrics-toggle-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'lyrics-toggle-btn';
        btn.setAttribute('aria-label', 'Show lyrics');
        btn.innerHTML = '<i class="fas fa-align-left" aria-hidden="true"></i>';
        document.body.appendChild(btn);

        lyricsView = document.createElement('div');
        lyricsView.id = 'lyrics-view';
        lyricsView.className = 'lyrics-view hidden';
        playlistEl.insertAdjacentElement('afterend', lyricsView);

        btn.addEventListener('click', () => {
            const showing = !lyricsView.classList.contains('hidden');
            playlistEl.classList.toggle('hidden', !showing);
            lyricsView.classList.toggle('hidden', showing);
            btn.classList.toggle('active', !showing);
            if (!showing) refreshLyricsView();
        });
    };

    // ---- wire up playback events that drive the sync loop ----
    audio.addEventListener('timeupdate', () => { checkTrackChange(); updateActiveLine(); });
    audio.addEventListener('play', () => { checkTrackChange(); updateActiveLine(); });
    audio.addEventListener('seeked', updateActiveLine);
    window.addEventListener('load', injectLyricsToggle);

    // ---- expose only what script.js needs ----
    window.refreshLyricsView = refreshLyricsView;
    window.updateActiveLyricLine = updateActiveLine;
    window.isLyricsTabActive = isLyricsTabActive;
    window.injectLyricsTabs = injectLyricsToggle;
})();