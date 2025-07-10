import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";

function AllSongs() {
  const [allSongs, setAllSongs] = useState([]);

  useEffect(() => {
    const fetchAllPlaylistSongs = async () => {
      const playlistsRef = collection(db, "playlists");

      const unsubscribe = onSnapshot(playlistsRef, async (snapshot) => {
        const uniqueSongIds = new Set();
        const songsData = [];

        for (const playlistDoc of snapshot.docs) {
          const playlist = playlistDoc.data();
          const songIds = playlist.songs || [];

          for (const songId of songIds) {
            if (!uniqueSongIds.has(songId)) {
              uniqueSongIds.add(songId);
              try {
                const songRef = doc(db, "songs", songId);
                const songSnap = await getDoc(songRef);
                if (songSnap.exists()) {
                  songsData.push({ id: songSnap.id, ...songSnap.data() });
                }
              } catch (error) {
                console.warn("Skipping song due to error:", err.message);

              }
            }
          }
        }

        setAllSongs(songsData);
      });

      return () => unsubscribe();
    };

    fetchAllPlaylistSongs();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Songs</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {allSongs.map((song) => (
          <div key={song.id} className="bg-base-200 rounded-lg p-4 shadow">
            <img
              src={song.image}
              alt={song.name}
              className="rounded-lg w-full h-40 object-cover"
            />
            <h2 className="text-lg font-semibold mt-2">{song.name}</h2>
            <p className="text-sm text-gray-500">{song.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllSongs;
