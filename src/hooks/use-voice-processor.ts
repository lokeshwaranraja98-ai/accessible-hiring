"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// TypeScript definitions for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}

declare var window: Window;

type RecognitionState = 'idle' | 'listening' | 'processing' | 'starting';

export const useVoiceProcessor = () => {
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setRecognitionState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Rebuild the full transcript for this utterance for live display
      setTranscript(prev => {
          const finalPortion = prev.replace(interimTranscript.split(' ')[0], '');
          return finalPortion + final + interimTranscript;
      });

      if (final) {
        setFinalTranscript(prev => prev + final);
      }
    };
    
    recognition.onend = () => {
        setRecognitionState(currentState => {
            // Only transition to idle if we were in a listening or starting state.
            // Avoids overriding a 'processing' state.
            if (currentState === 'listening' || currentState === 'starting') {
                return 'idle';
            }
            return currentState;
        });
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setRecognitionState('idle');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && recognitionState === 'idle') {
      setRecognitionState('starting');
      setTranscript('');
      setFinalTranscript('');
      recognitionRef.current.start();
    }
  }, [recognitionState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && recognitionState === 'listening') {
      recognitionRef.current.stop();
      setRecognitionState('processing');
    }
  }, [recognitionState]);
  
  const reset = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setRecognitionState('idle');
  }, []);

  const playAudio = useCallback((audioDataUri: string) => {
    return new Promise<void>((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioDataUri);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        resolve();
      };
      audio.onerror = () => {
        console.error("Error playing audio.");
        resolve();
      }
    });
  }, []);

  return {
    transcript,
    finalTranscript,
    recognitionState,
    startListening,
    stopListening,
    playAudio,
    reset,
  };
};
