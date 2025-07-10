import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { auth, googleProvider } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";

import toast, { Toaster } from "react-hot-toast";
import { FaGoogle, FaPhone } from "react-icons/fa";
import { MdMail } from "react-icons/md";

const SignUp = () => {
  const navigate = useNavigate();
  const [signupMode, setSignupMode] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleEmailSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("✅ Account created!");
      navigate("/profile");
    } catch (err) {
      toast.error("❌ " + err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("✅ Signed up with Google!");
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
      toast.success("📱 Phone verified!");
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
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Create Account</h2>

          {/* ✅ Phone Signup */}
          {signupMode === "phone" && (
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

          {/* ✅ Email Signup */}
          {signupMode === "email" && (
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
              <button className="btn btn-success w-full" type="button" onClick={handleEmailSignup}>
                Create Account
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="divider">Or sign up with</div>

          {/* Auth Buttons */}
          <div className="flex justify-center gap-6 text-xl">
            {signupMode === "email" ? (
              <button
                className="btn btn-circle btn-outline w-12 h-12"
                onClick={() => setSignupMode("phone")}
                title="Sign up with Phone"
              >
                <FaPhone />
              </button>
            ) : (
              <button
                className="btn btn-circle btn-outline w-12 h-12"
                onClick={() => setSignupMode("email")}
                title="Sign up with Email"
              >
                <MdMail />
              </button>
            )}

            <button
              className="btn btn-circle btn-outline w-12 h-12"
              onClick={handleGoogleSignup}
              title="Sign up with Google"
            >
              <FaGoogle />
            </button>
          </div>

          <div id="recaptcha-container"></div>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
