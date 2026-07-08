// src/hooks/useAll.js
import { useContext } from "react";
import { AllContext } from "../contexts/allContext";

export const useAll = () => useContext(AllContext);