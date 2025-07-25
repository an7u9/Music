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
    {src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352558/Marne_Se_Pehle_n3ecpc.mp3', title: 'Marne Se Pehle', artist: 'Armaan Malik', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353045/marne_wmutwh.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352568/Zaroorat_n1xzgl.mp3', title: 'Zaroorat Se Jyada', artist: 'Arijit Singh', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353049/Zaroorat_rql8tq.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352567/veham_vmamr7.mp3', title: 'Veham', artist: 'Armaan Malik', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353048/veham_nfzlrn.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352560/Barsaat_khuu0o.mp3', title: 'Barsaat', artist: 'Armaan Malik', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353041/Barsaat_oxszyv.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352547/intezaar_rudq7m.mp3', title: 'Tera Main Intezaar', artist: 'Armaan Malik', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353041/intezaar_uvm8nd.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352544/Baarishon_k7ihiu.mp3', title: 'Baarishon Mein', artist: 'Darshan Raval', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353041/Baarishon_f9kqd8.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352598/lqpz3cbbwuyds9eaqdqr.mp3', title: 'Judayiaan', artist: 'Darshan Raval', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353043/Judaiyaan_kqvlho.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352551/dil_rtcn48.mp3', title: 'Dil', artist: 'Raghav Chaitanya', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353042/dil_wnpfbf.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352555/Bhool_Jaa_h6oo1k.mp3', title: 'Bhool Jaa', artist: 'Arijit Singh', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353042/Bhool_Jaa_gdfdgg.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352553/Jeene_Bhi_De_qqxzw9.mp3', title: 'Jeene Bhi De', artist: 'Yasser Desai', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353042/Jeene_Bhi_De_llywub.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352560/Tu_Hi_Hai_piuv6p.mp3', title: 'Tu Hi Hai', artist: 'Rahul Mishra', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353047/Tu_Hi_Hai_dugsej.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352561/Naam_-_E_-_Wafa_ofiosg.mp3', title: 'Naam - E - Wafa', artist: 'Farhan Saeed', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353045/Naam_E_Wafa_tkecaf.jpg' },
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352553/Kya_Tujhe_Ab_Ye_Dil_Bataye_ufeixi.mp3', title: 'Kya Tujhe Ab Ye Dil Bataye', artist: 'Falak Shabbir', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353043/Kya_Tujhe_ptyb4w.jpg' }
  ],
  fresh: [
    { src: 'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753449538/Bade_Din_Huye_-_Song_Shantanu_M_Avneet_K_Kha_Ngan_Armaan_Malik_Amaal_Mallik_Rashmi_Virag_xpcerw.mp3', title: 'Bade Din Huye', artist: 'Armaan Malik', image: 'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753449730/d71fe6f9-b71a-4885-97e4-3c5499cb3702.png' }
  ],
  party: [
    { src:'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352557/Pretty_hzjoog.mp3', title:'Pretty Girl', artist:'Maggie Lindemann', image:'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353046/pretty_qz9rky.jpg'},
    { src:'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352550/Kya_Kardiya_vtwu00.mp3', title:'Kya Kardiya', artist:'Sushant KC', image:'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353044/kya_ojmkia.jpg'},
    { src:'https://res.cloudinary.com/dyp1fmsph/video/upload/v1753352566/proyojon_myisgu.mp3', title:'Nei Proyojon', artist:'Muza, Xefer', image:'https://res.cloudinary.com/dyp1fmsph/image/upload/v1753353047/proyojon_soj1fg.jpg'}
  ],
  favorites: [
    { src: 'songs/favSong1.mp3', title: 'Favorite Song 1', artist: 'Fav Artist', image: 'pics/favSong1.jpg' }
  ],
  chill: [
    { src: 'songs/Zaroorat.mp3', title: 'Chill Song 1', artist: 'Chill Artist', image: 'pics/Zaroorat.jpg' }
  ],
  focus: [
    { src: 'songs/Zaroorat.mp3', title: 'Focus Song 1', artist: 'Focus Artist', image: 'pics/Zaroorat.jpg' }
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
    playPauseBtn.querySelector('.fa-play').style.display = 'none';
    playPauseBtn.querySelector('.fa-pause').style.display = 'inline-block';
    playPauseBtn.classList.add('active');
  } else {
    playPauseBtn.querySelector('.fa-play').style.display = 'inline-block';
    playPauseBtn.querySelector('.fa-pause').style.display = 'none';
    playPauseBtn.classList.remove('active');
  }
};

const updateVolumeIcon = (volume) => {
  if (!volumeIcon) return;
  
  if (volume === 0) {
    volumeIcon.className = 'fas fa-volume-mute';
  } else if (volume < 0.5) {
    volumeIcon.className = 'fas fa-volume-down';
  } else {
    volumeIcon.className = 'fas fa-volume-up';
  }
};

// Core Functionality
const loadPlaylist = (playlistName) => {
  const currentlyPlayingSrc = audio.src;
  currentPlaylistName = playlistName;
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
      updatePlayPauseButton(true);
    } else {
      audio.pause();
      updatePlayPauseButton(false);
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
  const defaultPlaylistItem = document.querySelector('.playlist-list li[data-playlist="romantic"]');
  
  if (defaultPlaylistItem) {
    loadPlaylist(defaultPlaylist);
    defaultPlaylistItem.classList.add('active');
  }
  
  // Initial state setup
  playPauseBtn.querySelector('.fa-pause').style.display = 'none';
  
  // Set up navigation arrows for tablet view
  setupNavigationArrows();
  
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
    audio.play();
  } else {
    playNextTrack();
  }
});

// Control Button Listeners
playPauseBtn.addEventListener('click', () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play();
      updatePlayPauseButton(true);
    } else {
      audio.pause();
      updatePlayPauseButton(false);
    }
  } else if (tracks.length > 0) {
    playTrackFromPlaylist(0, currentPlaylistName);
  }
});

nextBtn.addEventListener('click', playNextTrack);
prevBtn.addEventListener('click', playPrevTrack);

// Loop Button
loopBtn.addEventListener('click', () => {
  isLooping = !isLooping;
  loopBtn.classList.toggle('active', isLooping);
});

// Shuffle Button
shuffleBtn.addEventListener('click', () => {
  isShuffling = !isShuffling;
  shuffleBtn.classList.toggle('active', isShuffling);
});

// Seek Bar
const updateSeekBarBackground = (value) => {
  seekBar.style.background = `
    linear-gradient(to right, white ${value}%, transparent ${value}%),
    linear-gradient(to right, #ff66cc, #ff33cc)
  `;
};

seekBar.addEventListener('input', () => {
  const seekTime = (seekBar.value / 100) * audio.duration;
  audio.currentTime = seekTime;
  updateSeekBarBackground(seekBar.value);
});

// Volume Bar
volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value;
  updateVolumeIcon(volumeBar.value);
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
});
