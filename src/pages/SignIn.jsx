import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import { FaGoogle, FaPhone } from "react-icons/fa";
import { MdMail } from "react-icons/md";

const SignIn = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("✅ Logged in successfully!");
      navigate("/");
    } catch (err) {
      toast.error("❌ " + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("✅ Logged in with Google!");
      navigate("/");
    } catch (err) {
      toast.error("❌ " + err.message);
    }
  };

  const sendOtp = async () => {
    if (!phone.startsWith("+91")) {
      toast.error("📱 Phone must start with +91");
      return;
    }

    try {
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });

      await window.recaptchaVerifier.render();

      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      toast.success("✅ OTP sent!");
    } catch (err) {
      toast.error("❌ " + err.message);
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      toast.success("📱 Logged in successfully!");
      navigate("/");
    } catch (err) {
      toast.error("❌ Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <Toaster position="top-center" />
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body text-base-content space-y-4 px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Sign In</h2>

          {/* ✅ Phone Login */}
          {mode === "phone" && (
            <form className="space-y-3">
              <input
                type="tel"
                placeholder="+91 Enter your phone number"
                className="input input-bordered w-full"
                onChange={(e) => setPhone(e.target.value)}
              />
              <button className="btn btn-accent w-full" type="button" onClick={sendOtp}>
                Send OTP
              </button>

              {confirmationResult && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="input input-bordered w-full"
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button className="btn btn-info w-full" type="button" onClick={verifyOtp}>
                    Verify OTP
                  </button>
                </>
              )}
            </form>
          )}

          {/* ✅ Email Login */}
          {mode === "email" && (
            <form className="space-y-3">
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
              <button className="btn btn-primary w-full" type="button" onClick={handleEmailLogin}>
                Sign In
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="divider">Or sign in with</div>

          {/* Auth Toggle Icons */}
          <div className="flex justify-center gap-6 text-xl">
            {mode === "email" ? (
              <button
                className="btn btn-circle btn-outline w-12 h-12"
                onClick={() => setMode("phone")}
                title="Sign in with Phone"
              >
                <FaPhone />
              </button>
            ) : (
              <button
                className="btn btn-circle btn-outline w-12 h-12"
                onClick={() => setMode("email")}
                title="Sign in with Email"
              >
                <MdMail />
              </button>
            )}

            <button
              className="btn btn-circle btn-outline w-12 h-12"
              onClick={handleGoogleLogin}
              title="Sign in with Google"
            >
              <FaGoogle />
            </button>
          </div>

          <div id="recaptcha-container"></div>

          <p className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary font-bold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
