import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import AddSongModal from "../components/AddSongModal";

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistImage, setPlaylistImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  const navigate = useNavigate();
  const DEFAULT_IMAGE = "https://source.unsplash.com/400x300/?music";

  // 🔁 Fetch user-specific playlists
  useEffect(() => {
    const q = query(
      collection(db, "playlists"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlaylists(results);
    });

    return () => unsubscribe();
  }, []);

  // ➕ Create new playlist
  const openCreateModal = () => {
    setEditMode(false);
    setPlaylistName("");
    setPlaylistImage("");
    document.getElementById("playlist_modal").showModal();
  };

  // ✏️ Edit existing playlist
  const openEditModal = (playlist) => {
    setEditMode(true);
    setEditingPlaylistId(playlist.id);
    setPlaylistName(playlist.name);
    setPlaylistImage(playlist.image === DEFAULT_IMAGE ? "" : playlist.image || "");
    document.getElementById("playlist_modal").showModal();
  };

  // ✅ Create or Update playlist
  const handleCreateOrUpdatePlaylist = async () => {
    if (!playlistName) return alert("Please enter a playlist name.");
    setLoading(true);

    try {
      if (editMode) {
        await updateDoc(doc(db, "playlists", editingPlaylistId), {
          name: playlistName,
          image: playlistImage || DEFAULT_IMAGE,
        });
      } else {
        await addDoc(collection(db, "playlists"), {
          name: playlistName,
          image: playlistImage || DEFAULT_IMAGE,
          songs: [],
          createdAt: serverTimestamp(),
          uid: auth.currentUser.uid,
        });
      }

      setPlaylistName("");
      setPlaylistImage("");
      setEditingPlaylistId(null);
      document.getElementById("playlist_modal").close();
    } catch (err) {
      alert("❌ Failed: " + err.message);
    }

    setLoading(false);
  };

  // 🗑 Delete playlist
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await deleteDoc(doc(db, "playlists", id));
    } catch (error) {
      alert("Failed to delete playlist: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-6">
      {/* 🔝 Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">📂 Your Playlists</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create Playlist
        </button>
      </div>

      {/* 🎧 Scrollable Playlist Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="card bg-base-100 shadow-md hover:shadow-lg transition duration-300"
            >
              <figure>
                <img
                  src={pl.image}
                  alt={pl.name}
                  className="h-40 w-full object-cover"
                />
              </figure>
              <div className="card-body">
                <h3 className="card-title">{pl.name}</h3>
                <p>{pl.songs?.length || 0} songs</p>
                <div className="card-actions justify-end flex-wrap gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => openEditModal(pl)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => navigate(`/playlist/${pl.id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleDelete(pl.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🎨 Create/Edit Playlist Modal */}
      <dialog id="playlist_modal" className="modal">
        <div className="modal-box space-y-4">
          <h3 className="font-bold text-lg">
            {editMode ? "✏️ Edit Playlist" : "🎵 Create New Playlist"}
          </h3>
          <input
            type="text"
            placeholder="Playlist Name"
            className="input input-bordered w-full"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            className="input input-bordered w-full"
            value={playlistImage}
            onChange={(e) => setPlaylistImage(e.target.value)}
          />
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => document.getElementById("playlist_modal").close()}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateOrUpdatePlaylist}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editMode
                ? "Update Playlist"
                : "Create Playlist"}
            </button>
          </div>
        </div>
      </dialog>

      {/* 🎶 Add Song Modal */}
      {isAddModalOpen && selectedPlaylistId && (
        <AddSongModal
          playlistId={selectedPlaylistId}
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedPlaylistId(null);
          }}
        />
      )}
    </div>
  );
}

export default Playlists;
