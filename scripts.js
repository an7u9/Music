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

// Audio instance and state
const audio = new Audio();
let currentTrackIndex = null;
let currentPlaylistName = null;
let tracks = [];
let isLooping = false;
let isShuffling = false;

// Playlists data
const playlists = {
  romantic: [
    { src: 'songs/Zaroorat.mp3', title: 'Zaroorat Se Jyada', artist: 'Arijit Singh', image: 'pics/Zaroorat.jpg' },
    { src: 'songs/veham.mp3', title: 'Veham', artist: 'Armaan Malik', image: 'pics/veham.jpg' },
    { src: 'songs/Barsaat.mp3', title: 'Barsaat', artist: 'Armaan Malik', image: 'pics/Barsaat.jpg' },
    { src: 'songs/intezaar.mp3', title: 'Tera Main Intezaar', artist: 'Armaan Malik', image: 'pics/intezaar.jpg' },
    { src: 'songs/Baarishon.mp3', title: 'Baarishon Mein', artist: 'Darshan Raval', image: 'pics/Baarishon.jpg' },
    { src: 'songs/Judaiyaan.mp3', title: 'Judayiaan', artist: 'Darshan Raval', image: 'pics/Judaiyaan.jpg' },
    { src: 'songs/dil.mp3', title: 'Dil', artist: 'Raghav Chaitanya', image: 'pics/dil.jpg' },
    { src: 'songs/Bhool Jaa.mp3', title: 'Bhool Jaa', artist: 'Arijit Singh', image: 'pics/Bhool Jaa.jpg' },
    { src: 'songs/Jeene Bhi De.mp3', title: 'Jeene Bhi De', artist: 'Yasser Desai', image: 'pics/Jeene Bhi De.jpg' },
    { src: 'songs/Tu Hi Hai.mp3', title: 'Tu Hi Hai', artist: 'Rahul Mishra', image: 'pics/Tu Hi Hai.jpg' },
    { src: 'songs/Naam - E - Wafa.mp3', title: 'Naam - E - Wafa', artist: 'Farhan Saeed', image: 'pics/Naam E Wafa.jpg' },
    { src: 'songs/Kya Tujhe Ab Ye Dil Bataye.mp3', title: 'Kya Tujhe Ab Ye Dil Bataye', artist: 'Falak Shabbir', image: 'pics/Kya Tujhe.jpg' }
  ],
  party: [
    { src:'songs/Pretty.mp3', title:'Pretty Girl', artist:'Maggie Lindemann', image:'pics/pretty.jpg'},
    { src:'songs/Kya Kardiya.mp3', title:'Kya Kardiya', artist:'Sushant KC', image:'pics/kya.jpg'},
    { src:'songs/proyojon.mp3', title:'Nei Proyojon', artist:'Muza, Xefer', image:'pics/proyojon.jpg'}
  ],
  workout: [
    { src: 'songs/workoutSong1.mp3', title: 'Workout Song 1', artist: 'Artist1', image: 'pics/workoutSong1.jpg' }
  ],
  favorites: [
    { src: 'songs/favSong1.mp3', title: 'Favorite Song 1', artist: 'Fav Artist', image: 'pics/favSong1.jpg' }
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
    playPauseBtn.classList.add('active', 'icon-pause');
    playPauseBtn.classList.remove('icon-play');
  } else {
    playPauseBtn.classList.remove('active', 'icon-pause');
    playPauseBtn.classList.add('icon-play');
  }
};

// Core Functionality
const loadPlaylist = (playlistName) => {
  const currentlyPlayingSrc = audio.src;
  currentPlaylistName = playlistName;
  tracks = playlists[playlistName] || [];
  playlist.innerHTML = '';

  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    const fullSrc = new URL(track.src, window.location.href).href;
    
    li.setAttribute('data-src', fullSrc);
    li.setAttribute('data-playlist', playlistName);
    li.setAttribute('data-index', index);
    li.innerHTML = `
      <span class="track-title">${track.title}</span>
      <span class="artist">${track.artist}</span>
      <span class="track-duration">Loading...</span>
    `;

    if (fullSrc === currentlyPlayingSrc && !audio.paused) {
      li.classList.add('playing');
    }

    playlist.appendChild(li);

    const audioTrack = new Audio(track.src);
    audioTrack.addEventListener('loadedmetadata', () => {
      li.querySelector('.track-duration').textContent = formatDuration(audioTrack.duration);
    });

    li.addEventListener('click', () => {
      playTrackFromPlaylist(index, playlistName);
    });
  });
};

const loadTrack = (trackIndex, playlistName) => {
  if (trackIndex >= 0 && trackIndex < tracks.length) {
    const selectedTrack = tracks[trackIndex];
    
    audio.src = selectedTrack.src;
    audio.play()
      .then(() => {
        trackTitle.textContent = selectedTrack.title;
        trackArtist.textContent = selectedTrack.artist;
        trackImage.src = selectedTrack.image;
        currentTrackIndex = trackIndex;
        currentPlaylistName = playlistName;
        
        updatePlayingClass();
        updatePlayPauseButton(true);
      })
      .catch(error => {
        console.error('Error playing track:', error);
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
      audio.play();
    } else {
      audio.pause();
    }
  }
};

const playNextTrack = () => {
  if (isShuffling) {
    let nextTrack;
    do {
      nextTrack = Math.floor(Math.random() * tracks.length);
    } while (nextTrack === currentTrackIndex && tracks.length > 1);
    currentTrackIndex = nextTrack;
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  }
  loadTrack(currentTrackIndex, currentPlaylistName);
};

const playPrevTrack = () => {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex, currentPlaylistName);
};

// Event Listeners
window.addEventListener('load', () => {
  const defaultPlaylist = 'romantic';
  const defaultPlaylistItem = document.querySelector('.playlist-list li[data-playlist]');
  
  if (defaultPlaylistItem) {
    loadPlaylist(defaultPlaylist);
    defaultPlaylistItem.classList.add('active');
    playTrackFromPlaylist(0, defaultPlaylist);
  }
});

document.querySelectorAll('.playlist-list li').forEach(playlistItem => {
  playlistItem.addEventListener('click', () => {
    document.querySelectorAll('.playlist-list li').forEach(item => {
      item.classList.remove('active');
    });
    playlistItem.classList.add('active');
    loadPlaylist(playlistItem.getAttribute('data-playlist'));
  });
});

// Audio Event Listeners
audio.addEventListener('play', () => {
  updatePlayingClass();
  updatePlayPauseButton(true);
});

audio.addEventListener('pause', () => {
  updatePlayingClass();
  updatePlayPauseButton(false);
});

audio.addEventListener('timeupdate', () => {
  const { currentTime, duration } = audio;
  seekBar.value = (currentTime / duration) * 100;
  currentTimeElem.textContent = formatDuration(currentTime);
  durationTimeElem.textContent = formatDuration(duration);
});

audio.addEventListener('ended', () => {
  if (isLooping) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNextTrack();
  }
});

// Control Event Listeners
playPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

nextBtn.addEventListener('click', playNextTrack);
prevBtn.addEventListener('click', playPrevTrack);

loopBtn.addEventListener('click', () => {
  isLooping = !isLooping;
  audio.loop = isLooping;
  loopBtn.classList.toggle('active', isLooping);
});

shuffleBtn.addEventListener('click', () => {
  isShuffling = !isShuffling;
  shuffleBtn.classList.toggle('active', isShuffling);
});

seekBar.addEventListener('input', () => {
  const newTime = (seekBar.value / 100) * audio.duration;
  audio.currentTime = newTime;
});

volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value / 100;
});
