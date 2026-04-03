import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_TEXT_LABELS, TextLabelKeys } from "@/constants/textLabels";

type TextLabelsType = typeof DEFAULT_TEXT_LABELS;

type ContextValue = {
  textLabels: TextLabelsType;
  setTextLabels: (next: TextLabelsType) => void;
  updateTextLabel: (key: TextLabelKeys, value: string) => void;
  saveTextLabels: () => void;
  resetTextLabels: () => void;
};

const TextLabelsContext = createContext<ContextValue | undefined>(undefined);

const STORAGE_KEY = "appTextLabels";

export const TextLabelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textLabels, setTextLabels] = useState<TextLabelsType>(DEFAULT_TEXT_LABELS);

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTextLabels(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error cargando textLabels:", e);
    }
  }, []);

  const updateTextLabel = (key: TextLabelKeys, value: string) => {
    setTextLabels(prev => ({ ...prev, [key]: value }));
  };

  const saveTextLabels = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(textLabels));
    } catch (e) {
      console.error("Error guardando textLabels:", e);
    }
  };

  const resetTextLabels = () => {
    setTextLabels(DEFAULT_TEXT_LABELS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Error removiendo textLabels:", e);
    }
  };

  return (
    <TextLabelsContext.Provider value={{ textLabels, setTextLabels, updateTextLabel, saveTextLabels, resetTextLabels }}>
      {children}
    </TextLabelsContext.Provider>
  );
};

export const useTextLabels = () => {
  const ctx = useContext(TextLabelsContext);
  if (!ctx) throw new Error("useTextLabels must be used within TextLabelsProvider");
  return ctx;
};

export default TextLabelsContext;
