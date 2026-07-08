// src/context/allContext.js
import { createContext } from "react";

export const AllContext = createContext({
  // Products
  products: [],
  fetchProducts: () => { },
  addProduct: () => { },
  deleteProduct: () => { },
  updateProduct: () => { },
  getProductById: () => { },
  searchProducts: () => { },

  // Certificates
  certificates: [],
  fetchCertificates: () => { },
  addCertificate: () => { },
  deleteCertificate: () => { },
  updateCertificate: () => { },
  getCertificateById: () => { },
  renewCertificate: () => { },
  searchCertificates: () => { },

  // Applications
  applications: [],
  fetchApplications: () => { },
  createApplication: () => { },
  getApplicationById: () => { },
  updateApplication: () => { },
  deleteApplication: () => { },
  acceptApplication: () => { },
  rejectApplication: () => { },
  searchApplications: () => { },
  getApplicationStats: () => { },

  // Common
  isLoading: false,
  setIsLoading: () => { },
  errors: "",
  setErrors: () => { }
});