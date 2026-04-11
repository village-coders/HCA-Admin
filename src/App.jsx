import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

import ProtectedRoutes from "./components/ProtectedRoutes"
import Dashboard from "./pages/Dashboard";
import Login from "./pages/login";
import Applications from "./pages/Applications";
import Certificates from "./pages/Certificates";
import Products from "./pages/Products";
import Companies from "./pages/Companies";
import ManageAdmins from "./pages/ManageAdmins";
import VerifyEmail from "./pages/verifyemail";
import Invoices from "./pages/Invoices";
import Audits from "./pages/Audits";
import Documents from "./pages/Documents";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ApplicationProcess from "./pages/ApplicationProcess";
import ShariaBoard from "./pages/ShariaBoard";

import AuthProvider from "./contexts/AuthProvider";
import AllProvider from "./contexts/AllProvider";
import { Toaster } from "sonner";
import AdminMessages from "./pages/Messages";
import { SocketProvider } from "./contexts/SocketContext";
import Messages from "./components/Messages";

function App() {
  return (
    <Router>
      <SocketProvider>
      <AuthProvider>
        <AllProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />

            <Route element={<ProtectedRoutes/>}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/products" element={<Products />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/manage-admins" element={<ManageAdmins />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/audits" element={<Audits />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/applications/:id/process" element={<ApplicationProcess />} />
                <Route path="/sharia-board" element={<ShariaBoard />} />
                
                <Route path="/message" element={<AdminMessages />} />
                <Route path="/socket-message" element={<Messages />} />
              </Route>
            </Route>
          </Routes>

          <Toaster
            position="top-right"
            richColors
            closeButton
            visibleToasts={1}
          />
        </AllProvider>
      </AuthProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
