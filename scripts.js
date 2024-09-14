const playlist = document.getElementById('playlist');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const trackImage = document.getElementById('track-image');
const currentTimeElem = document.getElementById('current-time');
const durationTimeElem = document.getElementById('duration-time');
const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const audio = new Audio();
let currentTrackIndex = 0;
let isLooping = false;
let isShuffling = false;

const tracks = [
    { src: 'songs/Zaroorat.mp3', title: 'Zaroorat Se Jyada', artist: 'Arijit Singh', image: 'pics/Zaroorat.jpg'},
    { src:'songs/veham.mp3',title:'Veham',artist:'Armaan Malik',image:'pics/veham.jpg'},
    { src: 'songs/Barsaat.mp3', title: 'Barsaat', artist: 'Armaan Malik', image: 'pics/Barsaat.jpg'},
    { src: 'songs/intezaar.mp3', title: 'Tera main intezaar', artist: 'Armaan Malik', image: 'pics/intezaar.jpg'},
    { src: 'songs/Baarishon.mp3', title: 'Baarishon Mein', artist: 'Darshan Raval', image: 'pics/Baarishon.jpg'},
    { src:'songs/Judaiyaan.mp3',title:'Judayiaan',artist:'Darshan Raval',image:'pics/Judaiyaan.jpg'},
    { src: 'songs/dil.mp3', title: 'Dil', artist: 'Raghav Chaitanya', image: 'pics/dil.jpg'}
];

// Load and play the selected track
const loadTrack = (trackIndex) => {
    const selectedTrack = tracks[trackIndex];
    audio.src = selectedTrack.src;
    audio.play();
    trackTitle.textContent = selectedTrack.title;
    trackArtist.textContent = selectedTrack.artist;
    trackImage.src = selectedTrack.image;
    Array.from(playlist.children).forEach((track, index) => {
        if (index === trackIndex) {
            track.classList.add('playing');
        } else {
            track.classList.remove('playing');
        }
    });
};

// Load the default track on page load
window.addEventListener('load', () => {
    loadTrack(currentTrackIndex);  // Default track (first track)
});

playlist.addEventListener('click', (event) => {
    const clickedTrack = event.target.closest('li');
    if (clickedTrack) {
        const trackIndex = Array.from(playlist.children).indexOf(clickedTrack);
        if (trackIndex !== -1) {
            currentTrackIndex = trackIndex;
            loadTrack(trackIndex);
        }
    }
});

const playNextTrack = () => {
    if (isShuffling) {
        currentTrackIndex = Math.floor(Math.random() * tracks.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    }
    loadTrack(currentTrackIndex);
};

const playPrevTrack = () => {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
};

// Toggle play/pause button state
playPauseBtn.addEventListener('click', () => {
    playPauseBtn.classList.toggle('active');
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});

document.getElementById('next-btn').addEventListener('click', playNextTrack);
document.getElementById('prev-btn').addEventListener('click', playPrevTrack);

document.getElementById('loop-btn').addEventListener('click', () => {
    isLooping = !isLooping;
    audio.loop = isLooping;
    document.getElementById('loop-btn').classList.toggle('active', isLooping);
});

document.getElementById('shuffle-btn').addEventListener('click', () => {
    isShuffling = !isShuffling;
    document.getElementById('shuffle-btn').classList.toggle('active', isShuffling);
});

// Update seek bar and time display
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    seekBar.value = progress;
    const currentMinutes = Math.floor(audio.currentTime / 60);
    const currentSeconds = Math.floor(audio.currentTime % 60);
    currentTimeElem.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
    const durationMinutes = Math.floor(audio.duration / 60);
    const durationSeconds = Math.floor(audio.duration % 60);
    durationTimeElem.textContent = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;
});

seekBar.addEventListener('input', () => {
    const seekTime = (seekBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
});

volumeBar.addEventListener('input', () => {
    audio.volume = volumeBar.value;
});

audio.addEventListener('ended', () => {
    if (isLooping) {
        audio.play();
    } else {
        playNextTrack();
    }
});
