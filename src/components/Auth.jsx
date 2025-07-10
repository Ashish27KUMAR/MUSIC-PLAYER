import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // 👀 Check login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 🔒 Google login
  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("✅ Logged in with Google");
    } catch (err) {
      alert("Google login error: " + err.message);
    }
  };

  // 📧 Email signup
  const handleEmailSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("✅ Signed up with Email");
    } catch (err) {
      alert("Signup error: " + err.message);
    }
  };

  // 📧 Email login
  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ Logged in with Email");
    } catch (err) {
      alert("Login error: " + err.message);
    }
  };

  // 📲 Send OTP to phone
const sendOtp = async () => {
  console.log("💬 sendOtp clicked");

  if (!phone.startsWith("+91")) {
    alert("📱 Phone number must start with +91");
    return;
  }

  try {
    // Destroy previous recaptcha if exists
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    // Setup new invisible reCAPTCHA
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha", {
      size: "invisible",
      callback: (response) => {
        console.log("✅ reCAPTCHA solved:", response);
      },
      "expired-callback": () => {
        alert("⚠️ reCAPTCHA expired. Try again.");
      }
    });

    await window.recaptchaVerifier.render();

    console.log("📤 Sending OTP to:", phone);
    const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    setConfirmationResult(result);
    alert("✅ OTP sent!");
  } catch (err) {
    console.error("❌ OTP send failed:", err);
    alert("❌ " + err.message);
  }
};



  // 🔐 Verify OTP
  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      alert("✅ Phone login successful");
    } catch (err) {
      alert("❌ Invalid OTP: " + err.message);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    alert("👋 Logged out");
  };

  // 👤 Logged-in view
  if (currentUser) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-xl text-center space-y-4">
        <h2 className="text-2xl font-bold">🎧 Welcome!</h2>
        <p className="text-lg">
          {currentUser.email
            ? `Logged in as: ${currentUser.email}`
            : `Phone: ${currentUser.phoneNumber}`}
        </p>
        <button onClick={handleLogout} className="btn btn-error w-full">
          Logout
        </button>
      </div>
    );
  }

  // 🔐 Auth Form
  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-xl space-y-4">
      <h2 className="text-xl font-bold text-center">Login / Signup</h2>

      {/* 🌐 Google Auth */}
      <button onClick={handleGoogle} className="btn btn-outline w-full">
        Login with Google
      </button>

      {/* 📧 Email/Password Auth */}
      <input
        type="email"
        placeholder="Email"
        className="input input-bordered w-full"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="input input-bordered w-full"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleEmailSignup} className="btn btn-primary w-full">
        Signup with Email
      </button>
      <button onClick={handleEmailLogin} className="btn btn-secondary w-full">
        Login with Email
      </button>

      {/* 📱 Phone Auth */}
      <input
        type="tel"
        placeholder="+91XXXXXXXXXX"
        className="input input-bordered w-full"
        onChange={(e) => setPhone(e.target.value)}
      />
      <div id="recaptcha"></div>
      <button onClick={sendOtp} className="btn btn-accent w-full">
        Send OTP
      </button>

      {/* 🔐 OTP Verification */}
      {confirmationResult && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            className="input input-bordered w-full"
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp} className="btn btn-success w-full">
            Verify OTP
          </button>
        </>
      )}
    </div>
  );
}

export default Auth;
