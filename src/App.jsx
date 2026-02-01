import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/dashboardLayout";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/login";
import Applications from "./pages/Applications";
import Certificates from "./pages/Certificates";
import Products from "./pages/Products";
import Companies from "./pages/Companies";
import ManageAdmins from "./pages/ManageAdmins";

import AuthProvider from "./contexts/AuthProvider";
import AllProvider from "./contexts/AllProvider";
import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AllProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/products" element={<Products />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/manage-admins" element={<ManageAdmins />} />
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
    </Router>
  );
}

export default App;
