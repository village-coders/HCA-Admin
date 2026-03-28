// src/context/AuthProvider.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AuthContext } from "./authContext";

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [verificationData, setVerificationData] = useState();
  const [signingIn, setSigningIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);


  const baseUrl = import.meta.env.VITE_BASE_URL;

  // 🔐 Token expiration checker
  useEffect(() => {
    const interval = setInterval(() => {
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken) return;
      
      try {
        const token = JSON.parse(storedToken);
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("accessToken");
          toast.error("Session expired. Please log in again.");
          navigate("/");
        }
      } catch (err) {
        console.error("Token parsing error", err);
        localStorage.removeItem("accessToken");
        navigate("/");
      }
    }, 60000); // check every 60 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {

    fetchUser();
  }, []);

  // 🧑‍🤝‍🧑 Fetch user
  const fetchUser = async () => {
    try {
      setUserLoading(true)
      const token = JSON.parse(localStorage.getItem("accessToken")); // assuming JWT auth
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = payload.id  // depends on your backend

      const res = await axios.get(`${baseUrl}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      

      setUser(res.data.user); // ✅ now your user is available everywhere
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // setUser(null);
    } finally{
      setUserLoading(false);
    }
  };

  // 🔑 Sign in
  const signin = async (formData, navigate) => {
    setSigningIn(true);
    try {
      const res = await axios.post(`${baseUrl}/auth/admin-login`, formData);
      const { message, accessToken, status, user } = res.data;
      
      if (status === "success") {
        if (user.role !== "admin" && user.role !== "super admin") {
          toast.error("You're not an admin");
          navigate("/");
        } else {
          // localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("accessToken", JSON.stringify(accessToken));
          toast.success(message);
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSigningIn(false);
    }
  };


  const signup = async (userData) => {
    setSigningUp(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/signup`, userData);
      const { message } = response.data;
      
      return message;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setSigningUp(false);
    }
  };


  const requestPasswordReset = async (email) => {
    setResettingPassword(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/forgot-password`, { email });
      toast.success(response.data.message);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset link';
      toast.error(message);
      return { success: false, message };
    } finally {
      setResettingPassword(false);
    }
  };

  const resetPassword = async (token, password) => {
    setResettingPassword(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/reset-password/${token}`, { password });
      toast.success(response.data.message);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setResettingPassword(false);
    }
  };


  const isAuthenticated = () => {
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) return false;

    try {
      const token = JSON.parse(storedToken);
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem("accessToken");
        toast.error("Session expired. Please log in again.");
        navigate("/");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Invalid token", error);
      localStorage.removeItem("accessToken");
      navigate("/");
      return false;
    }
  };


  // ✅ Verify account
  const verifyAccount = async (token) => {
    setVerifyingAccount(true);
    try {
      const res = await axios.post(`${baseUrl}/auth/verify/${token}`);
      setVerificationData(res.data);
    } catch (error) {
      setVerificationData(error.response?.data);
    } finally {
      setVerifyingAccount(false);
    }
  };

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const value = {
    user,
    signingIn,
    verifyingAccount,
    verificationData,
    fetchUser,
    signin,
    verifyAccount,
    logout,
    signingUp,
    signup,
    resetPassword,
    requestPasswordReset,
    resettingPassword,
    userLoading,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
