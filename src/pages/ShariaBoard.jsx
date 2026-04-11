import { useState, useEffect } from 'react';
import { 
  Building, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  Filter,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TableActions from '../components/TableActions';

const ShariaBoard = () => {
  const navigate = useNavigate();
  const { 
    applications, 
    isLoading, 
    fetchApplications, 
    approveShariaApplication,
    rejectApplication 
  } = useAll();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
  };

  const handleApprove = async (appId) => {
    if (window.confirm("Are you sure you want to approve this application for certification?")) {
      const result = await approveShariaApplication(appId);
      if (result.success) {
        fetchApplications();
      }
    }
  };

  const handleReject = async (appId) => {
    const reason = prompt("Enter the reason for sending back to corrections:");
    if (reason) {
      const result = await rejectApplication(appId, reason);
      if (result.success) {
        fetchApplications();
      }
    }
  };

  const shariaApplications = applications.filter(app => 
    (app.status === "With Shari'a Board") &&
    (app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     app.company?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#00853b]" />
            Shari'a Board Review
          </h1>
          <p className="text-gray-500 mt-1">Manage applications currently awaiting Al-Aqaba Shari'a Board formal approval.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats/Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Awaiting Review</div>
            <div className="text-2xl font-bold text-gray-900">{shariaApplications.length}</div>
          </div>
        </div>
        <div className="md:col-span-2 bg-[#00853b]/5 p-6 rounded-2xl border border-[#00853b]/10 flex items-start gap-4">
          <div className="w-10 h-10 bg-[#00853b]/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
            <AlertCircle className="w-5 h-5 text-[#00853b]" />
          </div>
          <p className="text-sm text-[#00853b]/80 leading-relaxed">
            Applications listed here have passed the on-site audit and technical review. 
            The Shari'a Board must formally endorse the certification request before the final certificate can be issued.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-black mb-12">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search company or application number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00853b] focus:border-transparent transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Application</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sent On</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shariaApplications.length > 0 ? (
                shariaApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{app.applicationNumber}</div>
                      <div className="text-xs text-gray-500">{app.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">{app.company?.companyName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {app.processData?.shariaBoardSentAt ? new Date(app.processData.shariaBoardSentAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-10">
                      <TableActions 
                        direction="up"
                        actions={[
                          {
                            label: 'View Tracking',
                            icon: Eye,
                            onClick: () => navigate(`/applications/${app._id}/process`),
                            color: 'text-blue-600'
                          },
                          {
                            label: 'Approve & Pass',
                            icon: CheckCircle,
                            onClick: () => handleApprove(app._id),
                            color: 'text-green-600'
                          },
                          {
                            label: 'Request Corrections',
                            icon: XCircle,
                            onClick: () => handleReject(app._id),
                            color: 'text-red-600'
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Award className="w-12 h-12 mb-3" />
                      <p className="text-gray-500 font-medium">No applications currently with Shari'a Board</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShariaBoard;
