"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceProcessor } from '@/hooks/use-voice-processor';

type Theme = "light" | "dark";
type RecognitionState = 'idle' | 'listening' | 'processing';

interface AccessibilityContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => void;
  speak: (text: string, force?: boolean) => void;
  cancelSpeech: () => void;
  isVoiceControlActive: boolean;
  toggleVoiceControl: () => void;
  recognitionState: RecognitionState;
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
  const [isVoiceControlActive, setIsVoiceControlActive] = useState<boolean>(false);

  const router = useRouter();
  // Using a separate instance of voice processor for global commands
  const voiceController = useVoiceProcessor();

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
  
  const speak = useCallback((text: string, force: boolean = false) => {
    if ('speechSynthesis' in window && (isSpeechEnabled || force)) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeechEnabled]);

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleVoiceControl = useCallback(() => {
    setIsVoiceControlActive(prev => {
        const nextState = !prev;
        if (nextState) {
            speak("Voice control activated.", true);
            voiceController.startListening();
        } else {
            voiceController.stopListening();
            voiceController.reset();
            speak("Voice control deactivated.", true);
        }
        return nextState;
    });
  }, [speak, voiceController]);

  // Voice command processing logic
  useEffect(() => {
    if (!isVoiceControlActive || !voiceController.finalTranscript) return;

    const command = voiceController.finalTranscript.toLowerCase().trim().replace(/[.,?]/g, '');
    let handled = false;

    if (!command) {
        voiceController.reset();
        return;
    };

    console.log(`[Voice Command] Received: "${command}"`);

    const navigationCommands: { [key: string]: string } = {
        'home': '/',
        'interviews': '/interviews/job-selection',
        'assessment': '/assessment',
        'login': '/login',
    };

    for (const key in navigationCommands) {
        if (command.includes(`go to ${key}`) || command.includes(`navigate to ${key}`)) {
            router.push(navigationCommands[key]);
            speak(`Navigating to ${key} page.`, true);
            handled = true;
            break;
        }
    }

    if (!handled) {
      const commandElements = document.querySelectorAll<HTMLElement>('[data-voice-command]');
      let targetElement: HTMLElement | null = null;
      
      for (const element of Array.from(commandElements)) {
          const commands = (element.dataset.voiceCommand || '').split('|');
          if (commands.includes(command)) {
              targetElement = element;
              break;
          }
      }

      if (targetElement) {
        speak(`Activating: ${command}`, true);
        targetElement.click();
        handled = true;
      } else if (command.includes('scroll down')) {
          window.scrollBy(0, window.innerHeight * 0.7);
          speak("Scrolling down.", true);
          handled = true;
      } else if (command.includes('scroll up')) {
          window.scrollBy(0, -window.innerHeight * 0.7);
          speak("Scrolling up.", true);
          handled = true;
      } else if (command.includes('stop listening') || command.includes('deactivate voice control')) {
          toggleVoiceControl();
          handled = true;
      }
    }
    
    // Check isVoiceControlActive again in case it was just toggled off
    if (isVoiceControlActive && !handled) { 
      speak(`Sorry, I didn't understand the command: ${voiceController.finalTranscript}`, true);
    }

    voiceController.reset();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceController.finalTranscript]);

  // This effect ensures that listening restarts if it stops but voice control is still active.
  useEffect(() => {
    if (isVoiceControlActive && voiceController.recognitionState === 'idle') {
      const timer = setTimeout(() => voiceController.startListening(), 100);
      return () => clearTimeout(timer);
    }
  }, [isVoiceControlActive, voiceController.recognitionState, voiceController.startListening]);


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
    cancelSpeech,
    isVoiceControlActive,
    toggleVoiceControl,
    recognitionState: voiceController.recognitionState
  }), [theme, setTheme, fontSize, increaseFontSize, decreaseFontSize, resetFontSize, isSpeechEnabled, toggleSpeech, speak, cancelSpeech, isVoiceControlActive, toggleVoiceControl, voiceController.recognitionState]);

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
