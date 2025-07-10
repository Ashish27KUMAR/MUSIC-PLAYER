import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  const getLinkClasses = (path) => {
    const isActive = location.pathname === path;
    return `px-3 py-2 block rounded-md transition ${
      isActive ? "bg-primary/20 font-semibold" : "hover:bg-base-200"
    }`;
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-base-100">
      {/* 🔹 Mobile Header */}
      <div className="sm:hidden bg-neutral text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">🎵 ApnaGaana</h2>
        <button
          className="btn btn-sm btn-ghost text-xl"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>
      </div>

      {/* 🔹 Mobile Drawer */}
      {showMobileMenu && (
        <div className="sm:hidden bg-neutral text-white p-4 space-y-4">
          <ul className="menu space-y-2">
            <li>
              <Link to="/" onClick={() => setShowMobileMenu(false)} className={getLinkClasses("/")}>
                🏠 Home
              </Link>
            </li>
            <li>
              <Link
                to="/playlists"
                onClick={() => setShowMobileMenu(false)}
                className={getLinkClasses("/playlists")}
              >
                📂 Playlists
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                onClick={() => setShowMobileMenu(false)}
                className={getLinkClasses("/profile")}
              >
                👤 Profile
              </Link>
            </li>
          </ul>
          {user && (
            <button className="btn btn-sm btn-error w-full mt-2" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      )}

      {/* 🔹 Sidebar Desktop */}
      <aside className="hidden sm:flex sm:flex-col w-60 bg-neutral text-white p-4 space-y-4">
        <h2 className="text-2xl font-bold mb-4">🎵 ApnaGaana</h2>
        <ul className="menu space-y-2">
          <li>
            <Link to="/" className={getLinkClasses("/")}>
              🏠 Home
            </Link>
          </li>
          <li>
            <Link to="/playlists" className={getLinkClasses("/playlists")}>
              📂 Playlists
            </Link>
          </li>
          <li>
            <Link to="/profile" className={getLinkClasses("/profile")}>
              👤 Profile
            </Link>
          </li>
        </ul>
        <div className="mt-auto text-center">
          {user && (
            <div className="flex justify-center">
              <button className="btn btn-sm btn-error" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 🔹 Main Content */}
      <main className="flex-1 p-0 bg-black text-white overflow-y-auto">
        <Toaster position="top-center" />
        {children}
      </main>
    </div>
  );
}

export default Layout;
