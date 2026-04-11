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
  AlertCircle,
  X,
  FileText
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
    rejectApplication,
    getApplicationById
  } = useAll();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

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

  const handleViewDetails = async (appId) => {
    setIsLoadingDetails(true);
    try {
      const application = await getApplicationById(appId);
      if (application) {
        setSelectedApplication(application);
        setIsViewModalOpen(true);
        setActiveDetailTab('overview');
      } else {
        toast.error("Failed to load application details");
      }
    } catch (error) {
      toast.error("Failed to load application details");
      console.log(error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getYesNoBadge = (value) => {
    const isYes = value === 'yes' || value === true;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isYes ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isYes ? 'Yes' : 'No'}
      </span>
    );
  };

  const shariaApplications = applications.filter(app => 
    (app.status === "With Shari'a Board") &&
    (app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     app.company?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = () => {
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge()}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-10">
                      <TableActions 
                        direction="up"
                        actions={[
                          {
                            label: 'View Details',
                            icon: Eye,
                            onClick: () => handleViewDetails(app._id)
                          },
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
                          },
                          // Add View Audit Report action if report exists
                          ...(app.processData?.audit?.auditReportFile ? [{
                            label: 'View Audit Report',
                            icon: FileText,
                            onClick: () => window.open(app.processData.audit.auditReportFile, '_blank'),
                            color: 'text-purple-600'
                          }] : [])
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

      {/* View Details Modal */}
      {isViewModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Application #{selectedApplication.applicationNumber || selectedApplication._id?.slice(-8)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Submitted on {formatDateTime(selectedApplication.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  {selectedApplication.status}
                </span>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="border-b border-gray-200 px-6">
              <div className="flex space-x-4">
                {['overview', 'halal-history', 'product-composition', 'facilities', 'markets', 'audit-report'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeDetailTab === tab
                        ? 'border-[#00853b] text-[#00853b]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6">
                {activeDetailTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <Building className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Company Name</p>
                          <p className="font-medium text-gray-900">{selectedApplication.company?.companyName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Registration No.</p>
                          <p className="font-medium text-gray-900">{selectedApplication.company?.registrationNo || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium text-gray-900">{selectedApplication.company?.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <Building className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Applicant Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">{selectedApplication.applicantName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Position</p>
                          <p className="font-medium text-gray-900">{selectedApplication.positionTitle || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{selectedApplication.applicantEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">{selectedApplication.applicantPhone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Product Name</p>
                          <p className="font-medium text-gray-900">{selectedApplication.productName || selectedApplication.product || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="font-medium text-gray-900">{selectedApplication.category || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Market Type</p>
                          <p className="font-medium text-gray-900">{selectedApplication.marketType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Brand Type</p>
                          <p className="font-medium text-gray-900">{selectedApplication.brandType || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {selectedApplication.foodSafetyPrograms && selectedApplication.foodSafetyPrograms.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Safety Programs</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.foodSafetyPrograms.map((program, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {program}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Application Type</p>
                          <p className="font-medium text-gray-900">{selectedApplication.applicationType || 'New'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-medium text-gray-900">{formatDateTime(selectedApplication.createdAt)}</p>
                        </div>
                        {selectedApplication.updatedAt && (
                          <div>
                            <p className="text-sm text-gray-600">Last Updated</p>
                            <p className="font-medium text-gray-900">{formatDateTime(selectedApplication.updatedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Reports</h3>
                      {selectedApplication.processData?.audit?.auditReportFile ? (
                        <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Final Audit Report</h4>
                            <p className="text-sm text-gray-500">Document uploaded by the lead auditor after completion.</p>
                          </div>
                          <a 
                            href={`${selectedApplication.processData.audit.auditReportFile}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium rounded-lg text-sm transition-colors"
                          >
                            View Report
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No audit report has been attached to this application yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'halal-history' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Halal Certification</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Has Applied Before</p>
                          {getYesNoBadge(selectedApplication.hasAppliedBefore)}
                          {selectedApplication.hasAppliedBefore === 'yes' && selectedApplication.previousHalalAgency && (
                            <p className="font-medium text-gray-900 mt-2">{selectedApplication.previousHalalAgency}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Previously Supervised</p>
                          {getYesNoBadge(selectedApplication.hasBeenSupervisedBefore)}
                          {selectedApplication.hasBeenSupervisedBefore === 'yes' && selectedApplication.supervisingHalalAgency && (
                            <p className="font-medium text-gray-900 mt-2">{selectedApplication.supervisingHalalAgency}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'product-composition' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Composition Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Uses Pork or Derivatives</p>
                          {getYesNoBadge(selectedApplication.usesPorkOrDerivatives)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Uses Animal Meat or Derivatives</p>
                          {getYesNoBadge(selectedApplication.usesAnimalMeatOrDerivatives)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Uses Gelatin or Capsule</p>
                          {getYesNoBadge(selectedApplication.usesGelatinOrCapsule)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Contains Alcohol</p>
                          {getYesNoBadge(selectedApplication.containsAlcohol)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Additives/Flavour Contain Alcohol</p>
                          {getYesNoBadge(selectedApplication.additivesOrFlavourContainAlcohol)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Uses Glycerine or Derivatives</p>
                          {getYesNoBadge(selectedApplication.usesGlycerineOrDerivatives)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'facilities' && (
                  <div className="space-y-6">
                    {selectedApplication.manufacturingFacility && (
                      <div className="bg-gray-50 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manufacturing Facility</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Company Name</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.companyName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.address || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Local Government Area</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.localGovtArea || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">City</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.city || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">State</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.state || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Country</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.country || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Contact Person</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.plantContact || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Position</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.positionTitle || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Telephone</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.telephoneNo || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{selectedApplication.manufacturingFacility?.emailAddress || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplication.additionalFacilities && selectedApplication.additionalFacilities.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Facilities</h3>
                        {selectedApplication.additionalFacilities.map((facility, index) => (
                          <div key={index} className="mb-4 p-4 bg-white rounded-lg">
                            <p className="font-medium text-gray-900">{facility.companyName}</p>
                            <p className="text-sm text-gray-600">{facility.address}, {facility.city}, {facility.state}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === 'markets' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Market Type</p>
                          <p className="font-medium text-gray-900">{selectedApplication.marketType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Brand Type</p>
                          <p className="font-medium text-gray-900">{selectedApplication.brandType || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'audit-report' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Reports</h3>
                      {selectedApplication.processData?.audit?.auditReportFile ? (
                        <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Final Audit Report</h4>
                            <p className="text-sm text-gray-500">Document uploaded by the lead auditor after completion.</p>
                          </div>
                          <a 
                            href={`${selectedApplication.processData.audit.auditReportFile}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium rounded-lg text-sm transition-colors"
                          >
                            View Report
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No audit report has been attached to this application yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoadingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00853b]"></div>
        </div>
      )}
    </div>
  );
};

export default ShariaBoard;
