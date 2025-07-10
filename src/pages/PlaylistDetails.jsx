import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import AddSongModal from "../components/AddSongModal";

function PlaylistDetails() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSongUrl, setCurrentSongUrl] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchPlaylist = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "playlists", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPlaylist({ id: docSnap.id, ...docSnap.data() });
      } else {
        setPlaylist(null);
      }
    } catch (err) {
      console.error("Error fetching playlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const deleteSong = async (index) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    const updatedSongs = [...(playlist?.songs || [])];
    updatedSongs.splice(index, 1);

    try {
      const docRef = doc(db, "playlists", id);
      await updateDoc(docRef, { songs: updatedSongs });
      setPlaylist({ ...playlist, songs: updatedSongs });
    } catch (error) {
      console.error("Error deleting song:", error);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp?.toDate) return { day: "", date: "", time: "" };
    const dateObj = timestamp.toDate();
    return {
      day: dateObj.toLocaleDateString(undefined, { weekday: "long" }),
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (loading) return <p className="text-center p-4 text-white">Loading playlist...</p>;
  if (!playlist) return <p className="text-center p-4 text-white">Playlist not found.</p>;

  const { day, date, time } = formatDateTime(playlist.createdAt);

  return (
    <div className="flex flex-col h-screen bg-black text-white px-4 py-6 sm:px-6 md:px-8">
      {/* 🔝 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold">{playlist.name}</h2>
        {/* Hidden on small screens; handled in details block below */}
        <div className="hidden sm:block">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            + Add Song
          </button>
        </div>
      </div>

      {/* 📸 Playlist Info + Add Song Button */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <img
          src={playlist.image || "https://source.unsplash.com/400x250/?playlist,music"}
          onError={(e) => (e.target.src = "https://source.unsplash.com/400x250/?playlist,music")}
          className="w-full md:w-64 h-48 object-cover rounded-lg"
          alt="Playlist Cover"
        />
        <div className="flex-1 text-sm text-gray-400 leading-relaxed flex flex-col justify-between">
          <div>
            <p><strong>🗓 Created on:</strong></p>
            <p><span className="inline-block w-20">Day:</span> {day}</p>
            <p><span className="inline-block w-20">Date:</span> {date}</p>
            <p><span className="inline-block w-20">Time:</span> {time}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap sm:justify-start">
  <p className="text-white font-semibold">
    🎵 Total songs: {playlist.songs?.length || 0}
  </p>
  <div className="sm:hidden">
    <button
      className="btn btn-primary"
      onClick={() => setIsAddModalOpen(true)}
    >
      + Add Song
    </button>
  </div>
</div>

        </div>
      </div>

      {/* 🎵 Song List */}
      <div className="flex-1 overflow-y-auto pr-1">
        {playlist.songs?.length === 0 ? (
          <p className="text-gray-500">No songs in this playlist yet.</p>
        ) : (
          <ul className="space-y-2">
            {playlist.songs.map((song, index) => (
              <li
                key={index}
                className="p-2 border rounded-md bg-base-200 flex items-center gap-3"
              >
                <img
                  src={song.image}
                  alt={song.name}
                  onError={(e) => (e.target.src = "https://source.unsplash.com/100x100/?music")}
                  className="w-14 h-14 object-cover rounded-md shrink-0"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{song.name}</p>
                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2 ml-2">
                  {song.url && (
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        setCurrentSongUrl(song.url);
                        document.getElementById("player_modal").showModal();
                      }}
                    >
                      ▶
                    </button>
                  )}
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => deleteSong(index)}
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ➕ Add Song Modal */}
      <AddSongModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          fetchPlaylist();
        }}
        playlistId={id}
      />

      {/* ▶ Player Modal */}
      <dialog id="player_modal" className="modal">
        <div className="modal-box p-4">
          <h3 className="text-lg font-bold mb-4">🎵 Now Playing</h3>
          {currentSongUrl ? (
            <div className="aspect-video">
              <ReactPlayer url={currentSongUrl} controls width="100%" height="100%" />
            </div>
          ) : (
            <p className="text-sm text-gray-400">No song selected.</p>
          )}
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => {
                document.getElementById("player_modal").close();
                setCurrentSongUrl("");
              }}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default PlaylistDetails;
