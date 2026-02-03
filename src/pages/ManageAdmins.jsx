import { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
} from "lucide-react";

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Admin",
  });

  // 🔹 FETCH ADMINS (SAFE)
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/users?role=admin`
      );
      const data = await res.json();

      const adminsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      const formattedAdmins = adminsArray.map((admin) => ({
        id: admin._id,
        name: admin.fullName || admin.name || "N/A",
        email: admin.email || "—",
        phone: admin.phone || "—",
        role: admin.role || "Admin",
        addedDate: admin.createdAt
          ? new Date(admin.createdAt).toISOString().split("T")[0]
          : "—",
        status: admin.isActive ? "Active" : "Inactive",
      }));

      setAdmins(formattedAdmins);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      setAdmins([]); // 🚨 never allow non-array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 🔹 ADD ADMIN (API)
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.warning("All fields are required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/users/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: newAdmin.name,
            email: newAdmin.email,
            password: newAdmin.password,
            phone: newAdmin.phone,
            role: newAdmin.role,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create admin");
console.log("TOKEN:", localStorage.getItem("token"));

      setShowAddForm(false);
      setNewAdmin({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "Admin",
      });

      fetchAdmins(); // 🔁 refresh list
    } catch (err) {
      console.error(err);
      toast.error("Error creating admin");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔹 SEARCH FILTER (SAFE)
  const filteredAdmins = Array.isArray(admins)
    ? admins.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleToggleStatus = (id) => {
    setAdmins((prev) =>
      prev.map((admin) =>
        admin.id === id
          ? {
              ...admin,
              status: admin.status === "Active" ? "Inactive" : "Active",
            }
          : admin
      )
    );
  };

  const handleDeleteAdmin = (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Super Admin":
        return "bg-purple-100 text-purple-800";
      case "Admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8 ">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Manage Admins
          </h1>
          <p className="text-gray-600 mt-1">Add and manage admin users</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 inline-flex items-center justify-center"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add New Admin
        </button>
      </div>

      {/* Add Admin Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-gray-200 to-green-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={newAdmin.name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  placeholder="Enter Password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={newAdmin.phone}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={newAdmin.role}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, role: e.target.value })
                  }
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
             <button
                onClick={handleAddAdmin}
                disabled={submitting}
                className="px-4 py-2 bg-[#00853b] text-white rounded-lg hover:bg-green-700"
              >
                {submitting ? "Creating..." : "Add Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            className="pl-10 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-[#00853b]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Admin
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Added Date
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    Loading admins...
                  </td>
                </tr>
              )}

              {!loading && filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No admins found
                  </td>
                </tr>
              )}

              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#00853b]/10 flex items-center justify-center">
                      <span className="font-bold text-[#00853b]">
                        {admin.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">{admin.name}</p>
                      <p className="text-xs text-gray-500">ID: #{admin.id}</p>
                    </div>
                  </td>

                  <td className="p-4 space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {admin.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {admin.phone}
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getRoleColor(admin.role)}`}
                    >
                      <Shield className="inline w-3 h-3 mr-1" />
                      {admin.role}
                    </span>
                  </td>

                  <td className="p-4 text-sm text-gray-500">
                    {admin.addedDate}
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(admin.id)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        admin.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {admin.status === "Active" ? (
                        <CheckCircle className="inline w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="inline w-3 h-3 mr-1" />
                      )}
                      {admin.status}
                    </button>
                  </td>

                  <td className="p-4 flex space-x-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {admin.role !== "Super Admin" && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">{filteredAdmins.length}</span> of{" "}
              <span className="font-medium">{admins.length}</span> admins
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Previous
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdmins;
