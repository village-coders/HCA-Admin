import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from '../assets/hcaLogo.png'
import { PulseLoader } from "react-spinners";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { requestPasswordReset, resettingPassword } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await requestPasswordReset(email);
    if (result.success) {
      setSubmitted(true);
    }
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-gray-200 to-green-500 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="HCA Logo"
            className="w-full h-full mb-6"
            loading="lazy"
          />
          <h1 className="text-3xl font-bold text-gray-800 text-center">Forgot Password</h1>
          <p className="text-gray-500 mt-1 text-center">
            {submitted 
              ? "Check your email for the reset link." 
              : "Enter your email address to receive a password reset link."}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resettingPassword}
              className="w-full bg-green-600 hover:bg-green-700 cursor-pointer text-white py-3 rounded-xl font-semibold shadow-md transition disabled:opacity-50"
            >
              {resettingPassword ? <PulseLoader color="white" size={8} /> : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center mt-4">
            <p className="text-green-600 font-medium mb-4">Email sent! Please check your inbox and spam folder.</p>
          </div>
        )}

        <div className="text-center">
          <Link to="/" className="text-green-600 hover:underline font-medium text-sm">
            Back to Login
          </Link>
        </div>

        <div className="text-center text-gray-500 text-sm mt-4">
          &copy; {year} Halal Certification Authority. All rights reserved.
        </div>
      </div>
    </div>
  );
}
