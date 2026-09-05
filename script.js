// DOM Elements
const playlist = document.getElementById('playlist');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const trackImage = document.getElementById('track-image');
const currentTimeElem = document.getElementById('current-time');
const durationTimeElem = document.getElementById('duration-time');
const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const loopBtn = document.getElementById('loop-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const volumeIcon = document.querySelector('.volume-icon');
const trackImageContainer = document.querySelector(".track-image-container");

// Audio instance and state
const audio = new Audio();
let currentTrackIndex = null;   // index of the track that's actually loaded/playing
let currentPlaylistName = null; // playlist that's actually loaded/playing
let browsedPlaylistName = null; // playlist currently shown in the list (may differ from the one playing)
let tracks = [];
let isLooping = false;
let isShuffling = false;

// Pool of metadata-probe Audio() instances, keyed by track src, so we
// don't recreate/leak a new Audio() object every time a playlist is loaded.
const metadataProbeCache = new Map();

const STORAGE_KEY = 'pinkbeats:prefs';

// Guard against next/prev being spammed and racing multiple play() promises.
let isTrackChangeInFlight = false;

// Playlists data

const playlists = {

    indie: [

        {
            id: 'parshawan',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1786284631/Parshawan_-_Harnoor_youtube_qj3mwx.mp3',
            title: 'Parshawan',
            artist: 'Harnoor',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1786284820/37d56d72-e0a3-461c-be73-dc9e7dc08377.png',
            lyrics: 'lyrics/parshawan.lrc'
        },

        {
            id: 'finding-her',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785187644/Finding_Her_-_kushagra_youtube_xqnlqf.mp3',
            title: 'Finding Her',
            artist: 'Kushagra',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785184696/b3a91fc3-80fa-43fc-b1ad-b598c4f41dbf.png',
            lyrics: 'lyrics/finding-her.lrc'
        },

        {
            id: 'iraaday',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785184328/Abdul_Hannan_Rovalio_-_Iraaday_Official_Music_Video_-_Abdul_Hannan_youtube_nogxsg.mp3',
            title: 'Iraaday',
            artist: 'Abdul Hannan',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785184696/b3a91fc3-80fa-43fc-b1ad-b598c4f41dbf.png',
            lyrics: 'lyrics/irraday.lrc'
        },

        {
            id: 'khat',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785185444/Khat_-_Navjot_Ahuja_youtube_uraaca.mp3',
            title: 'Khat',
            artist: 'Navjot Ahuja',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785185411/f6352879-abcd-413a-b471-6a6b58392a41.png',
            lyrics: 'lyrics/khat.lrc'
        },

        {
            id: 'inaam',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785185667/Inaam_-_Anuv_Jain_youtube_gtwtwo.mp3',
            title: 'Inaam',
            artist: 'Anuv Jain',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785185654/0217d86e-b2d4-4a7c-aa99-7d3f3d1a7722.png',
            lyrics: 'lyrics/inaam.lrc'
        },

        {
            id: 'khasara',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785186303/Khasara_-_Abdul_Hannan_youtube_kfjhot.mp3',
            title: 'Khasara',
            artist: 'Abdul Hannan',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785186335/a3fe46d5-6860-4a68-ab68-7bad42ee8805.png',
            lyrics: 'lyrics/khasara.lrc'
        },

        {
            id: 'bewajah',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785186954/KhoslaRaghu_Bewajah_Aarzu_EP_Lyric_Visualiser_-_KhoslaRaghu_youtube_aduqfs.mp3',
            title: 'Bewajah',
            artist: 'Khosla Raghu',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785186924/7c57f6c4-966d-404b-a18a-f9995d8fc77b.png'
        },

        {
            id: 'dooron-dooron',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785187238/Dooron_Dooron_-_Paresh_Pahuja_youtube_yts2nc.mp3',
            title: 'Dooron Dooron',
            artist: 'Paresh Pahuja',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785187229/6b7f83b6-7a78-4127-bf6d-6f5e38073138.png',
            lyrics: 'lyrics/dooron-dooron.lrc'
        },

        {
            id: 'afsos',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1785187390/Afsos_-_Anuv_Jain_youtube_f8jyax.mp3',
            title: 'Afsos',
            artist: 'Anuv Jain',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1785187413/3ff8b38e-9854-41cf-aa9f-52a26841347d.png',
            lyrics: 'lyrics/afsos.lrc'
        }
    ],

    international: [
        {
            id: 'if-you-love-her',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788492777/If_You_Love_Her_-_Forest_Blakk_youtube_gsloyj.mp3',
            title: 'If You Love Her',
            artist: 'Forest Blakk',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788492903/1d278ff5-9d5b-48fa-bf12-289f403a2e3c.png',
            lyrics: 'lyrics/if-you-love-her.lrc'
        },

        {
            id: 'you-are-the-reason',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788493616/You_Are_The_Reason_-_Calum_Scott_youtube_f9mgqs.mp3',
            title: 'You Are The Reason',
            artist: 'Calum Scott',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788493685/25c6ee10-c5bc-48db-8c35-434ed025f61e.png',
            lyrics: 'lyrics/youarethereason.krc'
        },

        {
            id: 'dancing-with-your-ghost',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788584784/Sasha_Alex_Sloan_-_Dancing_With_Your_Ghost_-_320_Kbps_gdeaii.mp3',
            title: 'Dancing With Your Ghost',
            artist: 'Sasha Sloan',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788584459/3dc652f2-7f89-4465-b44b-a3e1a6f41771.png',
            lyrics: 'lyrics/dancingghost.lrc'
        },

        {
            id: 'little-bit-better',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788586295/Caleb_Hearn_ROSIE_-_Little_Bit_Better_-_320_Kbps_fims57.mp3',
            title: 'Little Bit Better',
            artist: 'Caleb Hearn',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788586206/unnamed_ncukgk.jpg',
            lyrics: 'lyrics/littlebitbetter.lrc'
        },

        {
            id: 'Dandelions',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788493228/Dandelions_-_Ruth_B._youtube_bzfzlc.mp3',
            title: 'Dandelions',
            artist: 'Ruth B.',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788493434/e9ee3455-6ae4-4570-b02b-c6565bc2dce2.png',
            lyrics: 'lyrics/dandelions.lrc'
        },

        {
            id: 'memories',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788585475/Maroon_5_-_Memories_-_320_Kbps_memwbl.mp3',
            title: 'Memories',
            artist: 'Maroon 5',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788585460/9f307dd8-eac5-453c-9878-b4a4539547ba.png',
            lyrics: 'lyrics/memories.lrc'
        },

        {
            id: 'older',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788584988/Sasha_Alex_Sloan_-_Older_-_320_Kbps_y7hr6h.mp3',
            title: 'Older',
            artist: 'Sasha Alex Sloan',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788584953/6efd858e-4529-4ca2-88d2-2deb3e3130e3.png',
            lyrics: 'lyrics/older.lrc'
        },

        {
            id: 'howdoisaygoodbye',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1788585989/Dean_Lewis_-_How_Do_I_Say_Goodbye_-_320_Kbps_rz7jgd.mp3',
            title: 'How Do I Say Goodbye',
            artist: 'Dean Lewis',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1788585880/unnamed_zmdlwg.jpg',
            lyrics: 'lyrics/howdoisay.lrc'
        }
    ],

    romantic: [

        {
            id: 'marne-se-pehle',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352558/Marne_Se_Pehle_n3ecpc.mp3',
            title: 'Marne Se Pehle',
            artist: 'Armaan Malik',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353045/marne_wmutwh.jpg'
        },

        {
            id: 'zaroorat-se-jyada',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352568/Zaroorat_n1xzgl.mp3',
            title: 'Zaroorat Se Jyada',
            artist: 'Arijit Singh',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353049/Zaroorat_rql8tq.jpg'
        },

        {
            id: 'veham',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352567/veham_vmamr7.mp3',
            title: 'Veham',
            artist: 'Armaan Malik',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353048/veham_nfzlrn.jpg'
        },

        {
            id: 'barsaat',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352560/Barsaat_khuu0o.mp3',
            title: 'Barsaat',
            artist: 'Armaan Malik',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353041/Barsaat_oxszyv.jpg'
        },

        {
            id: 'tera-main-intezaar',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352547/intezaar_rudq7m.mp3',
            title: 'Tera Main Intezaar',
            artist: 'Armaan Malik',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353041/intezaar_uvm8nd.jpg'
        },

        {
            id: 'baarishon-mein',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352544/Baarishon_k7ihiu.mp3',
            title: 'Baarishon Mein',
            artist: 'Darshan Raval',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353041/Baarishon_f9kqd8.jpg'
        },

        {
            id: 'judayiaan',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352598/lqpz3cbbwuyds9eaqdqr.mp3',
            title: 'Judayiaan',
            artist: 'Darshan Raval',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353043/Judaiyaan_kqvlho.jpg'
        },

        {
            id: 'dil',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352551/dil_rtcn48.mp3',
            title: 'Dil',
            artist: 'Raghav Chaitanya',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353042/dil_wnpfbf.jpg'
        },

        {
            id: 'bhool-jaa',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352555/Bhool_Jaa_h6oo1k.mp3',
            title: 'Bhool Jaa',
            artist: 'Arijit Singh',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353042/Bhool_Jaa_gdfdgg.jpg'
        },

        {
            id: 'jeene-bhi-de',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352553/Jeene_Bhi_De_qqxzw9.mp3',
            title: 'Jeene Bhi De',
            artist: 'Yasser Desai',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353042/Jeene_Bhi_De_llywub.jpg'
        },

        {
            id: 'tu-hi-hai',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352560/Tu_Hi_Hai_piuv6p.mp3',
            title: 'Tu Hi Hai',
            artist: 'Rahul Mishra',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353047/Tu_Hi_Hai_dugsej.jpg'
        },

        {
            id: 'naam-e-wafa',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352561/Naam_-_E_-_Wafa_ofiosg.mp3',
            title: 'Naam - E - Wafa',
            artist: 'Farhan Saeed',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353045/Naam_E_Wafa_tkecaf.jpg'
        },

        {
            id: 'kya-tujhe-ab-ye-dil-bataye',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352553/Kya_Tujhe_Ab_Ye_Dil_Bataye_ufeixi.mp3',
            title: 'Kya Tujhe Ab Ye Dil Bataye',
            artist: 'Falak Shabbir',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353043/Kya_Tujhe_ptyb4w.jpg'
        }

    ],

    party: [
        {
            id: 'pretty-girl',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352557/Pretty_hzjoog.mp3',
            title: 'Pretty Girl',
            artist: 'Maggie Lindemann',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353046/pretty_qz9rky.jpg'
        },

        {
            id: 'kya-kardiya',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352550/Kya_Kardiya_vtwu00.mp3',
            title: 'Kya Kardiya',
            artist: 'Sushant KC',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353044/kya_ojmkia.jpg'
        },

        {
            id: 'nei-proyojon',
            src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352566/proyojon_myisgu.mp3',
            title: 'Nei Proyojon',
            artist: 'Muza, Xefer',
            image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353047/proyojon_soj1fg.jpg'
        }
    ],

    chill: [
        {
            id: 'chill-song-1',
            src: 'songs/Zaroorat.mp3',
            title: 'Chill Song 1',
            artist: 'Chill Artist',
            image: 'pics/Zaroorat.jpg'
        }
    ],

    focus: [
        {
            id: 'focus-song-1',
            src: 'songs/Zaroorat.mp3',
            title: 'Focus Song 1',
            artist: 'Focus Artist',
            image: 'pics/Zaroorat.jpg'
        }
    ]
};

// Utility Functions
const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const isPlaying = (trackSrc) => {
    return audio.src === trackSrc && !audio.paused;
};

function updateImageAnimation() {
    if (!trackImageContainer) return;

    trackImageContainer.classList.toggle("playing", !audio.paused);
}

const updatePlayingClass = () => {
    document.querySelectorAll('.playlist li').forEach(item => {
        item.classList.remove('playing');
    });

    if (audio.src) {
        const currentTrackElement = document.querySelector(`li[data-src="${audio.src}"]`);
        if (currentTrackElement && !audio.paused) {
            currentTrackElement.classList.add('playing');
        }
    }
};

const updatePlayPauseButton = (playing) => {
    if (playing) {
        playPauseBtn.querySelector('.fa-play').style.display = 'none';
        playPauseBtn.querySelector('.fa-pause').style.display = 'inline-block';
        playPauseBtn.classList.add('active');
        playPauseBtn.setAttribute('aria-pressed', 'true');
        playPauseBtn.setAttribute('aria-label', 'Pause');
    } else {
        playPauseBtn.querySelector('.fa-play').style.display = 'inline-block';
        playPauseBtn.querySelector('.fa-pause').style.display = 'none';
        playPauseBtn.classList.remove('active');
        playPauseBtn.setAttribute('aria-pressed', 'false');
        playPauseBtn.setAttribute('aria-label', 'Play');
    }
};

const updateVolumeIcon = (volume) => {
    if (!volumeIcon) return;

    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute volume-icon';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down volume-icon';
    } else {
        volumeIcon.className = 'fas fa-volume-up volume-icon';
    }
};

/* =========================================================
   Preferences persistence (volume / loop / shuffle)
   ========================================================= */

const loadPrefs = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Could not read saved preferences', error);
        return null;
    }
};

const savePrefs = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            volume: audio.volume,
            isLooping,
            isShuffling
        }));
    } catch (error) {
        console.warn('Could not save preferences', error);
    }
};

/* =========================================================
   Metadata probe pooling
   ========================================================= */

const getTrackDuration = (track) =>
    new Promise((resolve) => {

        if (metadataProbeCache.has(track.src)) {
            const cached = metadataProbeCache.get(track.src);
            if (cached.duration && !Number.isNaN(cached.duration)) {
                resolve(cached.duration);
                return;
            }
        }

        const probe = new Audio();
        probe.preload = 'metadata';
        probe.src = track.src;

        const onLoaded = () => {
            metadataProbeCache.set(track.src, { duration: probe.duration });
            probe.removeEventListener('loadedmetadata', onLoaded);
            probe.removeEventListener('error', onError);
            resolve(probe.duration);
        };

        const onError = () => {
            probe.removeEventListener('loadedmetadata', onLoaded);
            probe.removeEventListener('error', onError);
            resolve(null);
        };

        probe.addEventListener('loadedmetadata', onLoaded);
        probe.addEventListener('error', onError);
    });

/* =========================================================
   Media Session API
   ---------------------------------------------------------
   This is what gives you:
     1. Lock-screen / notification-shade playback controls with
        title, artist and artwork.
     2. Far more reliable background playback — without a populated
        Media Session, mobile Chrome/Android has no reason to treat
        the tab as an active media session and will more aggressively
        suspend the page once the screen locks, which is why "next
        track" silently stops firing. Once metadata + action handlers
        are set, the browser/OS shows a persistent media notification
        and keeps the session (and JS needed to advance tracks) alive.
   iOS Safari: this also works, but a plain browser tab still gets
   suspended in the background more aggressively than an installed
   PWA. See the manifest.json / "Add to Home Screen" setup for that.
   ========================================================= */

const isMediaSessionSupported = 'mediaSession' in navigator;

const updateMediaSessionMetadata = (track) => {
    if (!isMediaSessionSupported || !track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: currentPlaylistName
            ? currentPlaylistName.charAt(0).toUpperCase() + currentPlaylistName.slice(1)
            : '',
        artwork: track.image
            ? [
                { src: track.image, sizes: '96x96', type: 'image/png' },
                { src: track.image, sizes: '256x256', type: 'image/png' },
                { src: track.image, sizes: '512x512', type: 'image/png' }
              ]
            : []
    });
};

const updateMediaSessionPlaybackState = (playing) => {
    if (!isMediaSessionSupported) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
};

// Lets the lock screen show/update the scrub bar position.
const updateMediaSessionPositionState = () => {
    if (!isMediaSessionSupported || !navigator.mediaSession.setPositionState) return;
    if (!audio.duration || Number.isNaN(audio.duration)) return;

    try {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(audio.currentTime, audio.duration)
        });
    } catch (error) {
        // setPositionState can throw if called with stale/invalid values
        // mid-track-change; safe to ignore.
    }
};

const setupMediaSessionHandlers = () => {
    if (!isMediaSessionSupported) return;

    navigator.mediaSession.setActionHandler('play', () => {
        audio.play()
            .then(() => {
                updatePlayPauseButton(true);
                updateImageAnimation();
            })
            .catch((error) => console.error('Media session play failed:', error));
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        updatePlayPauseButton(false);
        updateImageAnimation();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextTrack();
    });

    // Optional but standard: 10s skip via lock-screen skip buttons.
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        audio.currentTime = Math.max(0, audio.currentTime - skip);
        updateMediaSessionPositionState();
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        if (audio.duration) {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + skip);
        }
        updateMediaSessionPositionState();
    });

    try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined && audio.duration) {
                audio.currentTime = details.seekTime;
                updateMediaSessionPositionState();
            }
        });
    } catch (error) {
        // 'seekto' isn't supported everywhere; harmless if it throws.
    }

    navigator.mediaSession.setActionHandler('stop', () => {
        audio.pause();
        audio.currentTime = 0;
        updatePlayPauseButton(false);
        updateImageAnimation();
        updateMediaSessionPlaybackState(false);
    });
};

// Core Functionality
const loadPlaylist = (playlistName) => {
    const currentlyPlayingSrc = audio.src;
    browsedPlaylistName = playlistName;
    tracks = playlists[playlistName] || [];
    playlist.innerHTML = '';

    // Update active playlist in the navbar
    document.querySelectorAll('.playlist-item').forEach(item => {
        if (item.getAttribute('data-playlist') === playlistName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    tracks.forEach((track, index) => {
        const li = document.createElement('li');
        const fullSrc = new URL(track.src, window.location.href).href;

        li.setAttribute('data-src', fullSrc);
        li.setAttribute('data-playlist', playlistName);
        li.setAttribute('data-index', index);
        li.className = 'track-details';
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        li.innerHTML = `
      <span class="track-title">${track.title}</span>
      <span class="artist">${track.artist}</span>
      <span class="track-duration">Loading...</span>
    `;

        if (fullSrc === currentlyPlayingSrc && !audio.paused) {
            li.classList.add('playing');
        }

        playlist.appendChild(li);

        // Reuse a cached metadata probe instead of creating + leaking a
        // brand new Audio() instance every time the playlist is (re)loaded.
        getTrackDuration(track).then((duration) => {
            const durationElem = li.querySelector('.track-duration');
            if (durationElem) {
                durationElem.textContent = duration
                    ? formatDuration(duration)
                    : '--:--';
            }
        });

        const activate = () => playTrackFromPlaylist(index, playlistName);

        li.addEventListener('click', activate);
        li.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activate();
            }
        });
    });
};

const loadTrack = (trackIndex, playlistName) => {
    // Always resolve against the actual playlist being played, not the
    // shared `tracks` variable (which reflects whatever playlist the user
    // is currently *browsing*, not necessarily what's playing).
    const playlistTracks = playlists[playlistName] || [];

    if (trackIndex >= 0 && trackIndex < playlistTracks.length) {
        const selectedTrack = playlistTracks[trackIndex];

        // Update track/UI metadata immediately so the interface never
        // shows stale info even if playback subsequently fails.
        trackTitle.textContent = selectedTrack.title;
        trackArtist.textContent = selectedTrack.artist;
        trackImage.src = selectedTrack.image;
        currentTrackIndex = trackIndex;
        currentPlaylistName = playlistName;

        audio.src = selectedTrack.src;

        updateMediaSessionMetadata(selectedTrack);

        isTrackChangeInFlight = true;

        audio.play()
            .then(() => {
                updatePlayingClass();
                if (isLyricsTabActive()) refreshLyricsView();
                updatePlayPauseButton(true);
                updateImageAnimation();
                updateMediaSessionPlaybackState(true);
            })
            .catch(error => {
                console.error('Error playing track:', error);
                updatePlayPauseButton(false);
                if (typeof showToast === 'function') {
                    showToast(`Couldn\u2019t play "${selectedTrack.title}". Tap play to retry.`);
                } else {
                    console.warn('Playback failed and no toast handler was available.');
                }
            })
            .finally(() => {
                isTrackChangeInFlight = false;
            });
    }
};

const playTrackFromPlaylist = (trackIndex, playlistName) => {
    if (currentTrackIndex !== trackIndex || currentPlaylistName !== playlistName) {
        currentPlaylistName = playlistName;
        currentTrackIndex = trackIndex;
        loadTrack(trackIndex, playlistName);
    } else {
        if (audio.paused) {
            audio.play()
                .then(() => updateMediaSessionPlaybackState(true))
                .catch(error => console.error('Error resuming track:', error));
            updatePlayPauseButton(true);
        } else {
            audio.pause();
            updatePlayPauseButton(false);
            updateMediaSessionPlaybackState(false);
        }
    }
};

const playNextTrack = () => {
    // Debounce: ignore rapid repeat clicks while a track change is
    // already resolving, to avoid racing multiple play() promises.
    if (isTrackChangeInFlight) return;

    const playlistTracks = playlists[currentPlaylistName] || [];
    if (playlistTracks.length === 0) return;

    let nextIndex;
    if (isShuffling) {
        do {
            nextIndex = Math.floor(Math.random() * playlistTracks.length);
        } while (nextIndex === currentTrackIndex && playlistTracks.length > 1);
    } else {
        nextIndex = (currentTrackIndex + 1) % playlistTracks.length;
    }
    loadTrack(nextIndex, currentPlaylistName);
};

const playPrevTrack = () => {
    if (isTrackChangeInFlight) return;

    const playlistTracks = playlists[currentPlaylistName] || [];
    if (playlistTracks.length === 0) return;

    const prevIndex = (currentTrackIndex - 1 + playlistTracks.length) % playlistTracks.length;
    loadTrack(prevIndex, currentPlaylistName);
};

// Event Listeners
window.addEventListener('load', () => {
    injectLyricsTabs();
    setupMediaSessionHandlers();
    const defaultPlaylist = 'indie'; // Set the default playlist to "indie"
    const defaultPlaylistItem = document.querySelector('.playlist-list li[data-playlist="indie"]');

    if (defaultPlaylistItem) {
        loadPlaylist(defaultPlaylist);
        defaultPlaylistItem.classList.add('active');
    }

    // Initial state setup
    playPauseBtn.querySelector('.fa-pause').style.display = 'none';

    // Set up navigation arrows for tablet view
    setupNavigationArrows();

    // Restore saved preferences (volume / loop / shuffle).
    const prefs = loadPrefs();
    if (prefs) {
        if (typeof prefs.volume === 'number' && !Number.isNaN(prefs.volume)) {
            audio.volume = prefs.volume;
            volumeBar.value = prefs.volume;
        }
        if (prefs.isLooping) {
            isLooping = true;
            loopBtn.classList.add('active');
            loopBtn.setAttribute('aria-pressed', 'true');
        }
        if (prefs.isShuffling) {
            isShuffling = true;
            shuffleBtn.classList.add('active');
            shuffleBtn.setAttribute('aria-pressed', 'true');
        }
    }

    // Initialize volume icon
    updateVolumeIcon(volumeBar.value);
});

// Navigation arrows functionality for tablet view
const setupNavigationArrows = () => {
    const prevArrow = document.querySelector('.nav-arrow.prev');
    const nextArrow = document.querySelector('.nav-arrow.next');
    const playlistList = document.querySelector('.playlist-list');

    if (!prevArrow || !nextArrow || !playlistList) return;

    let scrollAmount = 0;
    const scrollStep = 200;

    prevArrow.addEventListener('click', () => {
        scrollAmount = Math.max(0, scrollAmount - scrollStep);
        playlistList.style.transform = `translateX(-${scrollAmount}px)`;
        checkArrowVisibility();
    });

    nextArrow.addEventListener('click', () => {
        const maxScroll = playlistList.scrollWidth - playlistList.clientWidth;
        scrollAmount = Math.min(maxScroll, scrollAmount + scrollStep);
        playlistList.style.transform = `translateX(-${scrollAmount}px)`;
        checkArrowVisibility();
    });

    const checkArrowVisibility = () => {
        prevArrow.style.display = scrollAmount <= 0 ? 'none' : 'flex';
        nextArrow.style.display = scrollAmount >= (playlistList.scrollWidth - playlistList.clientWidth) ? 'none' : 'flex';
    };

    // Initial check
    checkArrowVisibility();
};

// Audio Event Listeners
audio.addEventListener('timeupdate', () => {
    currentTimeElem.textContent = formatDuration(audio.currentTime);
    updateActiveLyricLine();

    if (audio.duration) {
        const percentage = (audio.currentTime / audio.duration) * 100;
        seekBar.value = percentage;
        updateSeekBarBackground(percentage);
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationTimeElem.textContent = formatDuration(audio.duration);
});

audio.addEventListener('ended', () => {
    if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(error => console.error('Error looping track:', error));
    } else {
        playNextTrack();
    }
});

audio.addEventListener('error', () => {
    if (typeof showToast === 'function') {
        showToast('Something went wrong loading this track.');
    }
    updatePlayPauseButton(false);
});

// Control Button Listeners
playPauseBtn.addEventListener('click', () => {
    if (audio.src) {
        if (audio.paused) {
            audio.play()
                .then(() => {
                    updatePlayPauseButton(true);
                    updateImageAnimation();
                })
                .catch(error => {
                    console.error('Error playing track:', error);
                    if (typeof showToast === 'function') {
                        showToast('Playback couldn\u2019t start.');
                    }
                });
        } else {
            audio.pause();
            updatePlayPauseButton(false);
            updateImageAnimation();
        }
    } else if (tracks.length > 0) {
        playTrackFromPlaylist(0, browsedPlaylistName);
    }
});

audio.addEventListener("play", () => {
    updatePlayPauseButton(true);
    updatePlayingClass();
    updateImageAnimation();
    updateMediaSessionPlaybackState(true);
});

audio.addEventListener("pause", () => {
    updatePlayPauseButton(false);
    updatePlayingClass();
    updateImageAnimation();
    updateMediaSessionPlaybackState(false);
});

// Keep the lock-screen scrub bar roughly in sync. Throttled to ~1/sec
// since timeupdate can fire far more often than the lock screen needs.
let lastPositionStateUpdate = 0;
audio.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastPositionStateUpdate > 1000) {
        lastPositionStateUpdate = now;
        updateMediaSessionPositionState();
    }
});

audio.addEventListener('loadedmetadata', updateMediaSessionPositionState);

nextBtn.addEventListener('click', playNextTrack);
prevBtn.addEventListener('click', playPrevTrack);

// Loop Button
loopBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    loopBtn.classList.toggle('active', isLooping);
    loopBtn.setAttribute('aria-pressed', String(isLooping));
    savePrefs();
});

// Shuffle Button
shuffleBtn.addEventListener('click', () => {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle('active', isShuffling);
    shuffleBtn.setAttribute('aria-pressed', String(isShuffling));
    savePrefs();
});

// Seek Bar
const updateSeekBarBackground = (value) => {
    seekBar.style.background = `
    linear-gradient(to right, white ${value}%, transparent ${value}%),
    linear-gradient(to right, #ff66cc, #ff33cc)
  `;
};

seekBar.addEventListener('input', () => {
    if (!audio.duration) return;
    const seekTime = (seekBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
    updateSeekBarBackground(seekBar.value);
});

// Volume Bar
volumeBar.addEventListener('input', () => {
    audio.volume = volumeBar.value;
    updateVolumeIcon(volumeBar.value);
    savePrefs();
});

// Playlist Selection
document.querySelectorAll('.playlist-list li').forEach(item => {
    item.addEventListener('click', () => {
        const playlistName = item.getAttribute('data-playlist');
        if (playlistName) {
            loadPlaylist(playlistName);

            // If no track is playing, start playing the first track
            if (audio.paused && tracks.length > 0) {
                playTrackFromPlaylist(0, playlistName);
            }
        }
    });

    item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            item.click();
        }
    });
});

/* =========================================================
   Global keyboard shortcuts (standard media-player behavior)
   - Space: play/pause
   - ArrowRight / ArrowLeft: seek +/- 5s
   - ArrowUp / ArrowDown: volume +/- 5%
   Ignored while the user is typing in an input/textarea.
   ========================================================= */

document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement?.tagName;
    const isTypingContext = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;

    if (isTypingContext) return;

    switch (event.key) {
        case ' ':
        case 'Spacebar':
            event.preventDefault();
            playPauseBtn.click();
            break;

        case 'ArrowRight':
            if (audio.duration) {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
            }
            break;

        case 'ArrowLeft':
            if (audio.duration) {
                audio.currentTime = Math.max(0, audio.currentTime - 5);
            }
            break;

        case 'ArrowUp':
            event.preventDefault();
            audio.volume = Math.min(1, audio.volume + 0.05);
            volumeBar.value = audio.volume;
            updateVolumeIcon(audio.volume);
            savePrefs();
            break;

        case 'ArrowDown':
            event.preventDefault();
            audio.volume = Math.max(0, audio.volume - 0.05);
            volumeBar.value = audio.volume;
            updateVolumeIcon(audio.volume);
            savePrefs();
            break;

        default:
            break;
    }
});