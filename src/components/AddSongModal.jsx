import { useState } from "react";
import { parseBlob } from "music-metadata-browser";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";

function AddSongModal({ isOpen, onClose, playlistId }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddSong = async () => {
    if (!playlistId) return alert("❌ Playlist ID is missing.");

    if (!youtubeUrl && files.length === 0)
      return alert("❌ Please select at least one song.");

    setLoading(true);

    try {
      const playlistRef = doc(db, "playlists", playlistId);
      const playlistSnap = await getDoc(playlistRef);
      if (!playlistSnap.exists()) throw new Error("Playlist not found");

      const currentSongs = playlistSnap.data().songs || [];
      const newSongs = [];

      // ✅ Handle YouTube Song
      if (youtubeUrl) {
        const fullUrl = formatYouTubeUrl(youtubeUrl);
        const videoId = extractYouTubeId(fullUrl);

        if (!videoId) {
          alert("❌ Invalid YouTube URL");
          setLoading(false);
          return;
        }

        const youtubeSong = {
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          name: "YouTube Song",
          artist: "Unknown",
          url: fullUrl,
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };

        await addDoc(collection(db, "songs"), youtubeSong);

        newSongs.push({
          name: youtubeSong.name,
          artist: youtubeSong.artist,
          url: youtubeSong.url,
          image: youtubeSong.image,
        });
      }

      // ✅ Handle Local Files
      for (const file of files) {
        const metadata = await parseBlob(file);
        const url = URL.createObjectURL(file);

        const imageBlob = metadata.common.picture?.[0]
          ? URL.createObjectURL(new Blob([metadata.common.picture[0].data]))
          : "/default-song.jpg";

        const songData = {
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          name: metadata.common.title || file.name,
          artist: metadata.common.artist || "Unknown",
          duration: metadata.format.duration || 0,
          url,
          image: imageBlob,
        };

        await addDoc(collection(db, "songs"), songData);

        newSongs.push({
          name: songData.name,
          artist: songData.artist,
          url: songData.url,
          image: songData.image,
        });
      }

      const updatedSongs = [...currentSongs, ...newSongs];
      await updateDoc(playlistRef, { songs: updatedSongs });

      alert("✅ Song(s) added successfully to playlist!");
      setYoutubeUrl("");
      setFiles([]);
      onClose();
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      alert("❌ Failed to add song. " + error.message);
    }

    setLoading(false);
  };

  // ✅ Converts youtu.be to full YouTube link
  const formatYouTubeUrl = (url) => {
    if (url.includes("youtu.be")) {
      const videoId = url.split("/").pop().split("?")[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
  };

  const extractYouTubeId = (url) => {
    const regExp = /(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&#\n]+)/;
    const match = url.match(regExp);
    return match ? match[1] : "";
  };

  return (
    <dialog open={isOpen} className="modal">
      <div className="modal-box space-y-4">
        <h3 className="font-bold text-lg">🎶 Add Song</h3>

        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => {
            setYoutubeUrl(e.target.value);
            setFiles([]);
          }}
        />

        <div className="divider">OR</div>

        <input
          type="file"
          accept="audio/*"
          className="file-input w-full"
          multiple
          onChange={(e) => {
            setFiles(Array.from(e.target.files));
            setYoutubeUrl("");
          }}
        />

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddSong}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Song"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default AddSongModal;
