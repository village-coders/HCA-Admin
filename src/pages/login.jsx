import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {signin, signingIn} = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async(e) => {
    e.preventDefault();

    const formData = {email, password}

    try {
      await signin(formData, navigate)
    } catch (error) {
      console.log(error);      
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-gray-200 to-green-500 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="flex flex-col items-center">
          <img
            src="/src/assets/hcaLogo.png"
            alt="HCA Logo"
            className="w-full h-20 mb-3"
          />
          <h1 className="text-3xl font-bold text-gray-800">HCA Admin Portal</h1>
          <p className="text-gray-500 mt-1">
            Enter Your Credentials To Proceed to Your Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-12"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-md transition"
          >
            {signingIn ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="text-center text-gray-500 text-sm mt-4">
          &copy; 2026 HCA Admin. All rights reserved.
        </div>
      </div>
    </div>
  );
}
