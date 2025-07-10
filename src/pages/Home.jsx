import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { db, auth } from "../firebase";
import { getDocs, arrayRemove } from "firebase/firestore";

import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  
  
} from "firebase/firestore";



function Home() {
  const [songs, setSongs] = useState([]);



  const [currentSong, setCurrentSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("All Songs");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);
  const [moreInfoSong, setMoreInfoSong] = useState(null);

  const [selectedSong, setSelectedSong] = useState(null);

  const playerRef = useRef();
  const dropdownRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "playlists"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlaylists(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "playlists"), where("uid", "==", user.uid));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const uniqueUrls = new Set();
    const songsData = [];

    snapshot.docs.forEach((docSnap) => {
      const playlist = docSnap.data();
      const songObjs = playlist.songs || [];

      songObjs.forEach((song) => {
        if (!uniqueUrls.has(song.url)) {
          uniqueUrls.add(song.url);
          songsData.push(song);
        }
      });
    });

    setAllPlaylistSongs(songsData);
    if (!currentSong && songsData.length > 0) {
      setCurrentSong(songsData[0]);
    }
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  function handleClickOutside(event) {
    if (mobileOptionsRef.current && !mobileOptionsRef.current.contains(event.target)) {
      setShowMobileOptions(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);



  useEffect(() => {
    function handleClickOutside(e) {
      if (!dropdownRefs.current.some((ref) => ref?.contains(e.target))) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlayPause = () => setPlaying(!playing);
  const handleSongSelect = (song) => {
    setCurrentSong(song);
    setPlaying(true);
  };

  const handleProgress = (state) => {
    setProgress(state.played);
    setPlayedSeconds(state.playedSeconds);
  };

  const handleDuration = (d) => setDuration(d);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const skipNext = () => {
  const index = allPlaylistSongs.findIndex((s) => s.url === currentSong.url);
  const nextIndex = (index + 1) % allPlaylistSongs.length;
  setCurrentSong(allPlaylistSongs[nextIndex]);
  setPlaying(true);
};

const skipPrev = () => {
  const index = allPlaylistSongs.findIndex((s) => s.url === currentSong.url);
  const prevIndex = (index - 1 + allPlaylistSongs.length) % allPlaylistSongs.length;
  setCurrentSong(allPlaylistSongs[prevIndex]);
  setPlaying(true);
};


  const [allPlaylistSongs, setAllPlaylistSongs] = useState([]);


  const showToast = (message, type = "success") => {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `px-5 py-3 rounded-md text-sm font-medium shadow-md text-white ${
      type === "error" ? "bg-red-600" : "bg-green-600"
    } animate-slideInOut transition-all`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  const addToPlaylist = async (playlistId, song) => {
    try {
      await updateDoc(doc(db, "playlists", playlistId), {
        songs: arrayUnion(song) // ✅ Correct
      });
      showToast("Added to playlist");
      setShowPlaylistModal(false);
    } catch (err) {
      showToast("Failed to add song", "error");
    }
  };

  const toggleFavorite = (song) => {
    const exists = favorites.find((s) => s.url === song.url);
    if (exists) {
      setFavorites(favorites.filter((s) => s.url !== song.url));
      showToast("Removed from favorites");
    } else {
      setFavorites([...favorites, song]);
      showToast("Added to favorites");
    }
  };

  const [showMobileOptions, setShowMobileOptions] = useState(false);
const mobileOptionsRef = useRef(null);


 const deleteSong = async (song) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "playlists"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const promises = [];

    querySnapshot.forEach((playlistDoc) => {
      const playlistData = playlistDoc.data();
      const playlistId = playlistDoc.id;
      const songs = playlistData.songs || [];

      // Find the full song object in the playlist's songs array by matching URL
      const songToRemove = songs.find((s) => s.url === song.url);

      if (songToRemove) {
        promises.push(
          updateDoc(doc(db, "playlists", playlistId), {
            songs: arrayRemove(songToRemove),  // <-- pass full song object here
          })
        );
      }
    });

    await Promise.all(promises);

    // Update local state after deletion
    setSongs((prev) => prev.filter((s) => s.url !== song.url));
    setAllPlaylistSongs((prev) => prev.filter((s) => s.url !== song.url));

    // Update current song if deleted
    if (currentSong?.url === song.url) {
      const remainingSongs = allPlaylistSongs.filter((s) => s.url !== song.url);
      if (remainingSongs.length > 0) {
        setCurrentSong(remainingSongs[0]);
      } else {
        setCurrentSong(null);
        setPlaying(false);
      }
    }

    showToast("Song deleted from all playlists", "success");
  } catch (error) {
    console.error("Delete song error:", error);
    showToast("Failed to delete song", "error");
  }
};


  const isFav = (song) => favorites.some((s) => s.url === song.url);
 const filteredSongs =
  activeTab === "Favorite" ? favorites : allPlaylistSongs;



  return (
    <div className="h-screen flex flex-col bg-black text-white relative">
      <div id="toast-container" className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2"></div>
      {/* 🔝 Header */}
<div className="p-6 flex items-center justify-between">

  <div>
    <h2 className="text-3xl font-bold">ApnaGaana</h2>
    <p className="text-base text-white opacity-70 italic mt-1">
  Made with ❤️ by <span className="font-semibold">Ashish Kumar</span>
</p>

  </div>
  <button className="btn btn-success" onClick={handlePlayPause}>
    {playing ? "Pause" : "Play"}
  </button>
</div>

{/* 🔖 Tabs */}
<div className="px-6 border-b border-gray-700 flex flex-wrap items-center gap-6 justify-between">
  <div className="flex gap-6">
    {["All Songs", "Favorite"].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`pb-2 ${
          activeTab === tab
            ? "border-b-2 border-white font-semibold"
            : "text-gray-400"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>

  <div className="text-sm text-gray-400 whitespace-nowrap">
    Total Songs: <span className="font-medium text-white">{filteredSongs.length}</span>
  </div>
</div>


{/* 🎵 Scrollable Song List */}
<div className="flex-1 overflow-y-auto px-6 pt-4 pb-25 space-y-3">

  {filteredSongs.length === 0 ? (
    <p className="text-center text-gray-400">No songs found</p>
  ) : (
    filteredSongs.map((song, i) => (
      <div
        key={i}
        className="flex items-center justify-between bg-[#1a1a1a] px-4 py-3 rounded-lg hover:bg-[#2a2a2a] relative overflow-visible"
        onClick={() => handleSongSelect(song)}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm">{i + 1}</span>
          <img src={song.image} className="w-12 h-12 rounded" />
          <div>
            <p className="font-medium">{song.name}</p>
            <p className="text-xs text-gray-400">{song.artist}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center text-sm z-10">
          <span>{song.duration}</span>
          <div
            className="relative z-[999]"
            ref={(el) => (dropdownRefs.current[i] = el)}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(dropdownOpen === i ? null : i);
              }}
              className="cursor-pointer text-xl hover:text-gray-400"
              title="More options"
            >
              ⋮
            </span>
            {dropdownOpen === i && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded text-sm z-[9999] p-2 space-y-1">
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoreInfoSong(song);
                    setShowMoreInfoModal(true);
                    setDropdownOpen(null);
                  }}
                >
                  More Info
                </div>
                <div
                  className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSong(song);
                    setDropdownOpen(null);
                  }}
                >
                  Delete
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ))
  )}
</div>


      {/* 🎯 Playlist Modal with Glass Blur */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-[99999] backdrop-blur-md flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative text-black">
            <h3 className="text-lg font-semibold mb-4">Select Playlist</h3>

            {playlists.length > 0 ? (
              playlists.map((pl) => (
  <div
    key={pl.id}
    className="flex items-center gap-4 px-4 py-2 hover:bg-gray-100 rounded cursor-pointer"
    onClick={() => addToPlaylist(pl.id, selectedSong)}
  >
    <img
      src={pl.image || "https://source.unsplash.com/40x40/?playlist"}
      alt="playlist"
      className="w-10 h-10 rounded object-cover"
    />
    <span className="font-medium">{pl.name}</span>
  </div>
))

            ) : (
              <p className="text-gray-500 text-sm mb-2">No playlists found.</p>
            )}

            <button
              className="mt-4 text-blue-600 font-semibold hover:underline"
              onClick={() => {
                setShowPlaylistModal(false);
                navigate("/playlists");
              }}
            >
              ➕ Create Playlist
            </button>

            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
              onClick={() => setShowPlaylistModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

{/* 🔊 Responsive Bottom Player */}
<div className="fixed bottom-0 left-0 sm:left-64 right-0 bg-black border-t border-gray-800 px-4 py-4 z-[900]">
  <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center md:items-center justify-center md:justify-between gap-4 md:gap-6 text-center md:text-left">
    
    {/* 🎵 Song Info */}
    <div className="flex items-center gap-3 min-w-0 overflow-hidden justify-center md:justify-start">
      <img src={currentSong?.image || ""} className="w-12 h-12 rounded shrink-0" />
      <div className="truncate">
        <h3 className="font-semibold text-sm truncate">{currentSong?.name || "No song"}</h3>
        <p className="text-xs text-gray-400 truncate">{currentSong?.artist || "Unknown"}</p>
      </div>
    </div>

    {/* 🎛️ Controls + Volume */}
    <div className="flex flex-col md:flex-row items-center justify-center gap-3 whitespace-nowrap">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleFavorite(currentSong)}
          title={isFav(currentSong) ? "Remove from Favorite" : "Add to Favorite"}
          className="text-2xl"
        >
          {isFav(currentSong) ? <span className="text-red-500">❤️</span> : <span className="text-white">🤍</span>}
        </button>
        <button onClick={skipPrev}>⏮</button>
        <button className="text-2xl" onClick={handlePlayPause}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={skipNext}>⏭</button>
        <button>🔁</button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        🔊
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="range range-xs w-20 sm:w-24 md:w-28"
        />
      </div>
    </div>

    {/* 📊 Progress Bar */}
    <div className="flex items-center gap-2 text-xs text-gray-400 w-full justify-center md:justify-end max-w-full min-w-0 overflow-hidden">
      <span>{formatTime(playedSeconds)}</span>
      <div className="flex-1 max-w-[200px] sm:max-w-[260px] md:max-w-[280px] lg:max-w-[320px]">
        <div className="bg-gray-600 h-1 w-full rounded-full overflow-hidden">
          <div
            className="bg-green-400 h-1"
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
      </div>
      <span>{formatTime(duration)}</span>
    </div>
  </div>
</div>



{showMoreInfoModal && moreInfoSong && (
  <div className="fixed inset-0 z-[99999] backdrop-blur-sm flex items-center justify-center">
    <div className="bg-white text-black rounded-xl shadow-lg max-w-sm w-full p-6 relative">
      <button
        className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-black"
        onClick={() => setShowMoreInfoModal(false)}
      >
        ×
      </button>
      <h2 className="text-xl font-bold mb-4">Song Details</h2>
      <div className="flex flex-col items-center text-center">
        <img
          src={moreInfoSong.image}
          alt="Song"
          className="w-24 h-24 rounded mb-4 object-cover"
        />
        <p><strong>Name:</strong> {moreInfoSong.name}</p>
        <p><strong>Artist:</strong> {moreInfoSong.artist}</p>
        <p><strong>Duration:</strong> {moreInfoSong.duration}</p>
        <p className="break-all"><strong>URL:</strong> {moreInfoSong.url}</p>
      </div>
    </div>
  </div>
)}

      <ReactPlayer
  ref={playerRef}
  url={currentSong?.url || ""}
  playing={playing}
  volume={volume}
  muted={false}
  onProgress={handleProgress}
  onDuration={handleDuration}
  controls={false}
  width="0"
  height="0"
  config={{
    youtube: {
      playerVars: {
        modestbranding: 1,
        rel: 0,
      },
    },
    file: {
      attributes: {
        controlsList: "nodownload",
      },
      forceAudio: true,
    },
  }}
/>




    </div>
  );
}

export default Home;
