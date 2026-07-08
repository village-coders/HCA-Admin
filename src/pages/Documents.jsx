import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Eye, Download } from "lucide-react";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${baseUrl}/documents/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(response.data.data);
      if (response.data && response.data.status === "success") {
        setDocuments(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.company?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.companyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Documents</h1>
          <p className="text-gray-600">View relevant documents submitted by companies.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by company or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00853b] focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Total: {filteredDocuments.length}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-3xl text-[#00853b]"></i>
            <p className="mt-2 text-gray-500">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-folder-open text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
            <p className="text-gray-500 mt-1">There are no relevant documents matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Company</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Document Title</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Uploaded Date</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{doc.company?.companyName || doc.company?.fullName || "Unknown"}</div>
                      <div className="text-xs text-gray-500 mt-1">{doc.companyId}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <i className="fas fa-file-alt text-gray-400 mr-3"></i>
                        <span className="text-gray-800 font-medium">{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-3">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;
