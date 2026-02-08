import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AllContext } from "./allContext";

const AllProvider = ({ children }) => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState("");

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const hasLoggedOut = useRef(false);

  const getToken = () => JSON.parse(localStorage.getItem("accessToken"));

  // 🔐 Token expiration checker
  useEffect(() => {
    const interval = setInterval(() => {
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken || hasLoggedOut.current) return;

      try {
        const token = JSON.parse(storedToken);
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < now) {
          hasLoggedOut.current = true;
          localStorage.removeItem("accessToken");
          toast.error("Session expired. Please log in again.");
          navigate("/");
        }
      } catch {
        hasLoggedOut.current = true;
        localStorage.removeItem("accessToken");
        navigate("/");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
    fetchCertificates();
    fetchApplications();
    fetchCompanies();
  }, []);

  // 📦 Fetch products
  const fetchProducts = async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/products/admin-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProducts(res.data.products || []);
      setErrors("");
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setErrors("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  // 📜 Fetch certificates
  const fetchCertificates = async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCertificates(res.data || []);
      setErrors("");
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
      setErrors("Failed to load certificates");
    } finally {
      setIsLoading(false);
    }
  };

  // 📋 Fetch applications
  const fetchApplications = async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(res.data)
      
      setApplications(res.data || []);
      setErrors("");
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setErrors("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  // 📋 Fetch companies
  const fetchCompanies = async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/users?role=company`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // console.log(res.data)
      
      setCompanies(res.data.users || []);
      setErrors("");
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      setErrors("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  };

  // ➕ Create new application
  const createApplication = async (applicationData) => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Append all fields including files
      Object.entries(applicationData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array of files
          value.forEach((file) => {
            if (file instanceof File) {
              formData.append(key, file);
            }
          });
        } else if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const res = await axios.post(`${baseUrl}/applications`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setApplications(prev => [res.data, ...prev]);
      toast.success("Application submitted successfully!");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to create application:", error);
      toast.error(error.response?.data?.message || "Failed to submit application");
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔍 Get application by ID
  const getApplicationById = async (id) => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await axios.get(`${baseUrl}/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch application:", error);
      return null;
    }
  };

  // ✏️ Update application
  const updateApplication = async (id, applicationData) => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      Object.entries(applicationData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((file) => {
            if (file instanceof File) {
              formData.append(key, file);
            }
          });
        } else if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const res = await axios.put(`${baseUrl}/applications/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setApplications(prev => prev.map(app => 
        app.id === id ? res.data : app
      ));
      toast.success("Application updated successfully!");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to update application:", error);
      toast.error(error.response?.data?.message || "Failed to update application");
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Delete application
  const deleteApplication = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    try {
      const res = await axios.delete(`${baseUrl}/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      

      if(res.ok){
        setApplications(prev => prev.filter(app => app.id !== id));
        toast.success(data.message);
        return { success: true };
      }      
    } catch (error) {
      console.error("Failed to delete application:", error);
      toast.error(error.response?.data?.message || "Failed to delete application");
      return { success: false };
    }
  };


  // ❌ Reject application
  const rejectApplication = async (id, reason = "") => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const res = await axios.put(
        `${baseUrl}/applications/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'rejected', rejectionReason: reason } : app
      ));
      toast.success(res.data.message);
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to reject application:", error);
      toast.error(error.response?.data?.message || "Failed to reject application");
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const approveApplication = async (id, reason = "") => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const res = await axios.put(
        `${baseUrl}/applications/${id}/approve`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'rejected', rejectionReason: reason } : app
      ));
      toast.success(res.data.message);
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to reject application:", error);
      toast.error(error.response?.data?.message || "Failed to reject application");
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };


  // 📊 Get application statistics
  const getApplicationStats = async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await axios.get(`${baseUrl}/applications/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      return res.data.stats;
    } catch (error) {
      console.error("Failed to fetch application stats:", error);
      return null;
    }
  };

  // ➕ Add product
  const addProduct = async (productData) => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/products`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setProducts((prev) => [...prev, res.data.product]);
      toast.success(res.data.message);
      return { success: true, data: res.data };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Delete product
  const deleteProduct = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    try {
      const res = await axios.delete(`${baseUrl}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success(res.data.message);
      return { success: true };
    } catch {
      toast.error("Failed to delete product");
      return { success: false };
    }
  };

  // 🔄 Update product
  const updateProduct = async (id, productData) => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const res = await axios.put(`${baseUrl}/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? res.data.product : p))
      );
      toast.success("Product updated successfully!");
      return { success: true };
    } catch {
      toast.error("Failed to update product");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Approve product
  const approveProduct = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const res = await axios.put(`${baseUrl}/products/approve/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? res.data.products : p))
      );
      console.log(res.data)
      toast.success(res.data.message);
      return { success: true };
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to approve product");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Reject product
  const rejectProduct = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    setIsLoading(true);
    try {
      const res = await axios.put(`${baseUrl}/products/reject/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? res.data.products : p))
      );
      toast.success(res.data.message);
      return { success: true };
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to reject product");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 📄 Add certificate
  const addCertificate = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    // const formData = new FormData();
    // Object.entries(certificateData).forEach(([key, value]) => {
    //   if (value !== undefined) formData.append(key, value);
    // });

    setIsLoading(true);
    try {
      const res = await axios.post(
      `${baseUrl}/certificates/generate/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCertificates((prev) => [...prev, res.data]);
      toast.success("Certificate added successfully!");
      return { success: true };
    } catch {
      toast.error("Failed to add certificate");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Delete certificate
  const deleteCertificate = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    try {
      await axios.delete(`${baseUrl}/certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCertificates((prev) => prev.filter((c) => c.id !== id));
      toast.success("Certificate deleted");
      return { success: true };
    } catch {
      toast.error("Failed to delete certificate");
      return { success: false };
    }
  };

  // 🔄 Update certificate
  const updateCertificate = async (id, certificateData) => {
    const token = getToken();
    if (!token) return { success: false };

    const formData = new FormData();
    Object.entries(certificateData).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value);
    });

    setIsLoading(true);
    try {
      const res = await axios.put(
        `${baseUrl}/certificates/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? res.data.certificate : c))
      );
      toast.success("Certificate updated successfully!");
      return { success: true };
    } catch {
      toast.error("Failed to update certificate");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔁 Renew certificate
  const renewCertificate = async (id) => {
    const token = getToken();
    if (!token) return { success: false };

    try {
      const res = await axios.post(
        `${baseUrl}/certificates/renew/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message);
      return { success: true };
    } catch {
      toast.error("Failed to renew certificate");
      return { success: false };
    }
  };

  // 🔍 Get product by ID
  const getProductById = async (id) => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await axios.get(`${baseUrl}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      return res.data.product;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return null;
    }
  };

  // 🔍 Get certificate by ID
  const getCertificateById = async (id) => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await axios.get(`${baseUrl}/certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch certificate:", error);
      return null;
    }
  };

  
  const downloadCertificate = async (certificateId) => {
    const token = getToken();
    if (!token) {
      toast.error("Authentication required");
      return null;
    }

    try {
      const response = await axios.get(
        `${baseUrl}/certificates/${certificateId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'blob', // Important for file downloads
        }
      );
      
      // The backend should return a proper PDF file
      return response.data;
      
    } catch (error) {
      console.error("Download error:", error);
      
      // Extract error message
      let errorMessage = "Failed to download certificate";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Certificate not found";
        } else if (error.response.status === 401) {
          errorMessage = "Unauthorized - Please login again";
        } else if (error.response.data) {
          // Try to get error message from response
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }
      }
      
      toast.error(errorMessage);
      return null;
    }
  };


  // 📋 Get expiring certificates with option to generate PDF report
  const getExpiringCertificates = async (days = 30, generatePDF = false) => {
    const token = getToken();
    if (!token) {
      toast.error("Authentication required");
      return { success: false };
    }

    setIsLoading(true);
    try {
      const url = `${baseUrl}/certificates/expiring?days=${days}&generatePDF=${generatePDF}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setErrors("");
      
      if (generatePDF && res.data.reportId) {
        // Return both data and report info
        return {
          success: true,
          certificates: res.data.certificates || [],
          reportInfo: {
            reportId: res.data.reportId,
            downloadUrl: res.data.downloadUrl,
            message: res.data.message
          }
        };
      }
      
      return {
        success: true,
        certificates: res.data || []
      };
    } catch (error) {
      console.error("Failed to fetch expiring certificates:", error);
      const errorMsg = error.response?.data?.message || "Failed to load expiring certificates";
      setErrors(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // 📄 Download certificate report (PDF)
  const downloadCertificateReport = async (reportId) => {
    const token = getToken();
    if (!token) {
      toast.error("Authentication required");
      return { success: false };
    }

    try {
      toast.loading("Downloading report...", { id: "report-download" });
      
      const response = await axios.get(
        `${baseUrl}/certificates/reports/download/${reportId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expiring-certificates-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss("report-download");
      toast.success("Report downloaded successfully!");
      
      return { success: true };
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.dismiss("report-download");
      
      let errorMessage = "Failed to download report";
      if (error.response?.status === 404) {
        errorMessage = "Report not found or expired";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 📊 Get expiring certificates report (new function for report generation)
  const generateExpiringCertificatesReport = async (days = 30) => {
    const token = getToken();
    if (!token) {
      toast.error("Authentication required");
      return { success: false };
    }

    try {
      toast.loading("Generating report...", { id: "report-generation" });
      
      const res = await axios.get(
        `${baseUrl}/certificates/expiring?days=${days}&generatePDF=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.dismiss("report-generation");
      
      if (res.data.reportId) {
        toast.success("Report generated successfully!");
        return {
          success: true,
          certificates: res.data.certificates || [],
          reportInfo: {
            reportId: res.data.reportId,
            downloadUrl: res.data.downloadUrl,
            message: res.data.message
          }
        };
      } else {
        toast.warning("No report generated. Please try again.");
        return { success: false, error: "No report generated" };
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.dismiss("report-generation");
      
      const errorMsg = error.response?.data?.message || "Failed to generate report";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };



  const value = {
    // Products
    products,
    fetchProducts,
    addProduct,
    deleteProduct,
    updateProduct,
    getProductById,
    approveProduct,
    rejectProduct,



    // Companies

    fetchCompanies,
    companies,
    
    // Certificates
    certificates,
    fetchCertificates,
    addCertificate,
    deleteCertificate,
    updateCertificate,
    getCertificateById,
    renewCertificate,
    downloadCertificate,

    getExpiringCertificates,
    generateExpiringCertificatesReport,
    downloadCertificateReport,
    
    // Applications
    applications,
    fetchApplications,
    createApplication,
    getApplicationById,
    updateApplication,
    deleteApplication,
    approveApplication,
    rejectApplication,
    getApplicationStats,
    
    // Common
    isLoading,
    setIsLoading,
    errors,
    setErrors
  };

  return (
    <AllContext.Provider value={value}>
      {children}
    </AllContext.Provider>
  );
};

export default AllProvider;