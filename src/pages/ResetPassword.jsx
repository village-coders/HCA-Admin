import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import logo from '../assets/hcaLogo.png'
import { PulseLoader } from "react-spinners";
import { toast } from "sonner";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, resettingPassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    const result = await resetPassword(token, password);
    if (result.success) {
      setTimeout(() => navigate("/"), 2000);
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
          <h1 className="text-3xl font-bold text-gray-800 text-center">Reset Password</h1>
          <p className="text-gray-500 mt-1 text-center">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="relative">
            <label className="block text-gray-700 mb-1 font-medium">New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={resettingPassword}
            className="w-full bg-green-600 hover:bg-green-700 cursor-pointer text-white py-3 rounded-xl font-semibold shadow-md transition disabled:opacity-50"
          >
            {resettingPassword ? <PulseLoader color="white" size={8} /> : "Update Password"}
          </button>
        </form>

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
