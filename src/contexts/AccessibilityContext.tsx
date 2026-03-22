"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

type Theme = "light" | "dark";

interface AccessibilityContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => void;
  speak: (text: string) => void;
  cancelSpeech: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const FONT_SIZE_STEP = 1;
const MIN_FONT_SIZE = 80;
const MAX_FONT_SIZE = 120;
const DEFAULT_FONT_SIZE = 100;

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState<boolean>(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedFontSize = localStorage.getItem("fontSize");
    const storedSpeech = localStorage.getItem("speechEnabled");

    if (storedTheme) {
      setThemeState(storedTheme);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setThemeState(systemTheme);
    }

    if (storedFontSize) {
      setFontSize(Number(storedFontSize));
    }
    
    if (storedSpeech) {
      setIsSpeechEnabled(storedSpeech === 'true');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.fontSize = `${fontSize}%`;
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);
  
  useEffect(() => {
    localStorage.setItem('speechEnabled', String(isSpeechEnabled));
    if (!isSpeechEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [isSpeechEnabled]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const increaseFontSize = () => {
    setFontSize((prevSize) => Math.min(prevSize + FONT_SIZE_STEP, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize((prevSize) => Math.max(prevSize - FONT_SIZE_STEP, MIN_FONT_SIZE));
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const toggleSpeech = () => {
    setIsSpeechEnabled(prev => !prev);
  };
  
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const value = useMemo(() => ({
    theme,
    setTheme,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    isSpeechEnabled,
    toggleSpeech,
    speak,
    cancelSpeech
  }), [theme, fontSize, isSpeechEnabled, speak, cancelSpeech]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};
