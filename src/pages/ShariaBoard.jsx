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
  FileText,
  Upload,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const ShariaBoard = () => {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  
  const hasPrivilege = (priv) => {
    if (user?.role === 'super admin') return true;
    return user?.privileges?.includes(priv);
  };
  
  const [logsheets, setLogsheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogsheet, setSelectedLogsheet] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  
  // Signature upload state
  const [signatureFile, setSignatureFile] = useState(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [uploadName, setUploadName] = useState(user?.signatureName || user?.fullName || '');
  const [uploadTitle, setUploadTitle] = useState(user?.signatureTitle || "Member, Shari'a Board");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const getToken = () => JSON.parse(localStorage.getItem('accessToken'));

  const resolveUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Remove leading /api if it exists to avoid double prepending with API_BASE_URL
    const cleanPath = path.startsWith('/api') ? path.replace('/api', '') : path;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const fetchLogsheets = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/logsheets`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setLogsheets(res.data);
    } catch (error) {
      toast.error('Failed to load logsheets');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsheets();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogsheets();
    setIsRefreshing(false);
  };

  const handleUploadSignature = async () => {
    if (!signatureFile && !user?.signatureImage) return; // Must have an existing image or a new one
    
    setIsUploadingSignature(true);
    const formData = new FormData();
    if (signatureFile) {
      formData.append('signature', signatureFile);
    }
    if (uploadName) formData.append('signatureName', uploadName);
    if (uploadTitle) formData.append('signatureTitle', uploadTitle);

    try {
      await axios.post(`${API_BASE_URL}/users/signature`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${getToken()}`
        }
      });
      toast.success('Signature uploaded successfully');
      setIsSetupModalOpen(false);
      setSignatureFile(null);
      fetchUser(); // Refresh user context to get new signature URL
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleSignLogsheet = async (logsheetId) => {
    setIsSigning(true);
    try {
      await axios.post(`${API_BASE_URL}/logsheets/sign`, { logsheetId }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Logsheet signed successfully');
      setIsSignModalOpen(false);
      fetchLogsheets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign logsheet');
    } finally {
      setIsSigning(false);
    }
  };

  const handleMarkSuccessful = async (applicationId) => {
    try {
      setIsLoading(true);
      
      // Step 1: Submit Step 8 (Marks it Approved/Successful)
      let formData = new FormData();
      formData.append('step', 8);
      await axios.patch(`${API_BASE_URL}/applications/${applicationId}/process`, formData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Step 2: Submit Step 9 (Confirms for processing, advancing it to Certificate Processing)
      formData = new FormData();
      formData.append('step', 9);
      await axios.patch(`${API_BASE_URL}/applications/${applicationId}/process`, formData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Application marked as successful and confirmed for processing');
      setIsSignModalOpen(false);
      fetchLogsheets();
    } catch (error) {
      toast.error('Failed to mark application as successful');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogsheets = logsheets.filter(ls => 
    ls.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ls.applicationId?.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasSigned = (logsheet) => {
    return logsheet.signatures?.some(s => s.user?._id === user?.id || s.user === user?.id);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#00853b]" />
            Shari'a Board Panel
          </h1>
          <p className="text-gray-500 mt-1">Review logsheets and provide authorized digital signatures.</p>
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

      {/* Signature Setup Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex flex-shrink-0 items-center justify-center ${user?.signatureImage ? 'bg-green-50' : 'bg-amber-50'}`}>
              {user?.signatureImage ? <UserCheck className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-amber-600" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Your Digital Signature</h3>
              <p className="text-sm text-gray-500">
                {user?.signatureImage ? 'Your signature is ready for use.' : 'Please upload a transparent PNG of your signature to sign logsheets.'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {user?.signatureImage && (
              <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl h-10 flex items-center">
                <img src={resolveUrl(user.signatureImage)} alt="My Signature" className="h-full object-contain" />
              </div>
            )}
            {hasPrivilege("Shari'a Board") ? (
              <button 
                onClick={() => {
                  setUploadName(user?.signatureName || user?.fullName || '');
                  setUploadTitle(user?.signatureTitle || "Member, Shari'a Board");
                  setSignatureFile(null);
                  setIsSetupModalOpen(true);
                }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all flex items-center h-10 gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {user?.signatureImage ? 'Update Signature' : 'Setup Signature'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-400">
                <Lock className="w-3.5 h-3.5" />
                Board Member Only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-black mb-12">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search company or application..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00853b] outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Logsheet / Application</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Signatures</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-300" />
                  </td>
                </tr>
              ) : filteredLogsheets.length > 0 ? (
                filteredLogsheets.map((ls) => (
                  <tr key={ls._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{ls.applicationId?.applicationNumber}</div>
                      <div className="text-xs text-gray-500">Created {new Date(ls.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-700">{ls.companyName}</div>
                      <div className="text-xs text-gray-400">{ls.companyEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {ls.signatures?.map((sig, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center overflow-hidden" title={sig.user?.fullName}>
                              {sig.user?.signatureImage ? (
                                <img src={resolveUrl(sig.user.signatureImage)} alt="Sig" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-500 ml-2">
                          {ls.signatures?.length || 0} signed
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        ls.isFinalized ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ls.isFinalized ? 'Finalized' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setSelectedLogsheet(ls);
                          setIsSignModalOpen(true);
                        }}
                        className="p-2 bg-[#00853b]/10 text-[#00853b] hover:bg-[#00853b] hover:text-white rounded-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                    No logsheets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sign/View Modal */}
      {isSignModalOpen && selectedLogsheet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center text-black">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-[#00853b]" />
                Logsheet Endorsement
              </h2>
              <button 
                onClick={() => setIsSignModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-black">
              {/* Info Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company</label>
                    <p className="font-bold text-lg text-gray-900">{selectedLogsheet.companyName}</p>
                    <p className="text-sm text-gray-500">{selectedLogsheet.companyEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Application #</label>
                    <p className="font-semibold text-gray-700">{selectedLogsheet.applicationId?.applicationNumber}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                  <FileText className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 mb-4">Audit Report Document</p>
                  <a 
                    href={resolveUrl(selectedLogsheet.auditReport)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#00853b] hover:bg-gray-50 shadow-sm transition-all"
                  >
                    View Report
                  </a>
                </div>
              </div>

              {/* Signatures Area */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2">Digital Endorsements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedLogsheet.signatures?.map((sig, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center text-center">
                      <div className="h-16 flex items-center justify-center mb-3">
                        <img src={resolveUrl(sig.signatureImage)} alt="Signature" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <p className="font-bold text-sm text-gray-900 mb-0.5">{sig.signerName || sig.user?.fullName}</p>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{sig.signerTitle || "Member, Shari'a Board"}</p>
                      <p className="text-[10px] text-gray-400">{new Date(sig.signedAt).toLocaleString()}</p>
                    </div>
                  ))}
                  
                  {/* Empty slots or current user sign button */}
                    {!hasSigned(selectedLogsheet) && !selectedLogsheet.isFinalized && (
                      <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                        {!hasPrivilege("Shari'a Board") ? (
                          <>
                            <Lock className="w-8 h-8 text-slate-300" />
                            <p className="text-xs text-center text-slate-400">Authorized Shari'a Board members only.</p>
                          </>
                        ) : user?.signatureImage ? (
                          <>
                            <p className="text-xs font-semibold text-gray-400">Ready to provide endorsement</p>
                            <button 
                              onClick={() => handleSignLogsheet(selectedLogsheet._id)}
                              disabled={isSigning}
                              className="w-full py-3 bg-[#00853b] text-white rounded-xl font-bold shadow-lg shadow-[#00853b]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                              {isSigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                              Sign Logsheet
                            </button>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-8 h-8 text-amber-500 opacity-50" />
                            <p className="text-xs text-center text-gray-500">You must upload your signature image first.</p>
                            <button 
                              onClick={() => setIsSignModalOpen(false)}
                              className="text-xs font-bold text-[#00853b] hover:underline"
                            >
                              Go Upload Now
                            </button>
                          </>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedLogsheet.isFinalized ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm font-bold text-gray-600">
                  {selectedLogsheet.isFinalized ? 'This certificate is formally endorsed' : 'Awaiting remaining board members'}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedLogsheet.isFinalized && (
                  hasPrivilege("Audit Manager") || hasPrivilege("Shari'a Board") ? (
                    <button 
                      onClick={() => handleMarkSuccessful(selectedLogsheet.applicationId?._id || selectedLogsheet.applicationId)}
                      disabled={isLoading}
                      className="px-6 py-2 bg-[#00853b] text-white rounded-xl text-sm font-bold hover:bg-[#007032] transition-all flex items-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Mark Application Successful
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      Awaiting Completion
                    </div>
                  )
                )}
                <button 
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Signature Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center text-black">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCheck className="text-[#00853b]" />
                {user?.signatureImage ? 'Update Signature setup' : 'Signature Setup'}
              </h2>
              <button 
                onClick={() => setIsSetupModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-black">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Full Name</label>
                <input 
                  type="text" 
                  placeholder="E.g. Sheikh Abdullah"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00853b] outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Official Title</label>
                <input 
                  type="text" 
                  placeholder="E.g. Member, Shari'a Board"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00853b] outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Digital Signature Image (PNG)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    id="sig-upload-modal" 
                    hidden 
                    accept="image/png" 
                    onChange={e => setSignatureFile(e.target.files[0])}
                  />
                  <label 
                    htmlFor="sig-upload-modal"
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-all flex items-center gap-2 w-full justify-center"
                  >
                    <Upload className="w-4 h-4" />
                    {signatureFile ? signatureFile.name : (user?.signatureImage ? 'Choose new transparent PNG...' : 'Choose transparent PNG...')}
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsSetupModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadSignature}
                disabled={isUploadingSignature || !uploadName || !uploadTitle || (!user?.signatureImage && !signatureFile)}
                className="px-6 py-2 bg-[#00853b] text-white rounded-xl text-sm font-bold hover:bg-[#007032] transition-all flex items-center gap-2 disabled:bg-gray-300 shadow-sm shadow-[#00853b]/20"
              >
                {isUploadingSignature ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShariaBoard;
