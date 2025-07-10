import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Profile = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: "",
    gender: "",
    dob: "",
    photoURL: "",
  });

  const [loading, setLoading] = useState(true);
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      } else {
        await setDoc(userRef, {
          name: user.displayName || "",
          dob: "",
          gender: "",
          photoURL: user.photoURL || "",
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSavePhotoURL = async () => {
    if (!newPhotoUrl || !user) return;

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { photoURL: newPhotoUrl });

    setProfileData((prev) => ({ ...prev, photoURL: newPhotoUrl }));
    setNewPhotoUrl("");
    setShowPhotoUrlInput(false);
    toast.success("✅ Profile photo updated!");
  };

  const handleSave = async () => {
    if (!user) return;

    const { name, gender, dob, photoURL } = profileData;

    if (!name.trim() || !gender.trim() || !dob.trim()) {
      toast.error("❌ Please fill all required details to continue.");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      name,
      gender,
      dob,
      photoURL: photoURL || "", // photo is optional
    });

    toast.success("✅ Profile updated!");
    navigate("/"); // ✅ Redirect to Home
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">👤 Profile</h1>

      <div className="card bg-base-200 shadow-xl p-6">
        <div className="flex flex-col items-center space-y-5">
          {/* Avatar with pencil icon */}
          <div className="relative">
            <div className="avatar">
              <div className="w-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={
                    profileData.photoURL ||
                    user.photoURL ||
                    "/default-avatar.png"
                  }
                  alt="avatar"
                />
              </div>
            </div>

            {/* Pencil Icon */}
            <button
              onClick={() => setShowPhotoUrlInput(!showPhotoUrlInput)}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-white p-1 rounded-full shadow-md cursor-pointer hover:scale-110 transition"
              title="Change Profile Picture via URL"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536M4 20h4l10-10-4-4L4 16v4z"
                />
              </svg>
            </button>
          </div>

          {/* Show input for new photo URL */}
          {showPhotoUrlInput && (
            <div className="flex flex-col items-center space-y-2 w-full max-w-sm">
              <input
                type="url"
                placeholder="Enter image URL"
                className="input input-bordered w-full"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
              />
              <button
                className="btn btn-sm btn-accent"
                onClick={handleSavePhotoURL}
              >
                Update Photo
              </button>
            </div>
          )}

          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="input input-bordered w-full max-w-sm"
            value={profileData.name}
            onChange={handleChange}
          />

          {/* Gender */}
          <select
            name="gender"
            className="select select-bordered w-full max-w-sm"
            value={profileData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="Male">♂️ Male</option>
            <option value="Female">♀️ Female</option>
            <option value="Other">⚧️ Other</option>
          </select>

          {/* DOB */}
          <input
            type="date"
            name="dob"
            className="input input-bordered w-full max-w-sm"
            value={profileData.dob}
            onChange={handleChange}
          />

          {/* Email / Phone display */}
          <div className="text-sm text-gray-400 mt-2">
            📧 {user.email || `📱 ${user.phoneNumber}`}
          </div>

          {/* Save Button */}
          <button className="btn btn-primary mt-4" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
