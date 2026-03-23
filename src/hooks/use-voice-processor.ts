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
  const fullTranscriptRef = useRef('');

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
      let finalTranscriptSegment = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptSegment += transcriptSegment;
        } else {
          interimTranscript += transcriptSegment;
        }
      }

      setTranscript(fullTranscriptRef.current + interimTranscript);

      if (finalTranscriptSegment) {
        const newFullTranscript = fullTranscriptRef.current + finalTranscriptSegment;
        fullTranscriptRef.current = newFullTranscript;
        setFinalTranscript(newFullTranscript);
      }
    };
    
    recognition.onend = () => {
        setRecognitionState(currentState => {
            if (currentState === 'listening' || currentState === 'starting') {
                return 'idle';
            }
            return currentState;
        });
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
            setRecognitionState('idle');
        }
    };

    recognitionRef.current = recognition;

    return () => {
      if(recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    setRecognitionState(currentState => {
      if (recognitionRef.current && currentState === 'idle') {
        setTranscript('');
        setFinalTranscript('');
        fullTranscriptRef.current = '';
        try {
          recognitionRef.current.start();
          return 'starting';
        } catch (error) {
          console.error("Could not start recognition:", error);
          return 'idle';
        }
      }
      return currentState;
    });
  }, []);

  const stopListening = useCallback(() => {
    setRecognitionState(currentState => {
      if (recognitionRef.current && (currentState === 'listening' || currentState === 'starting')) {
        recognitionRef.current.stop();
        return 'processing';
      }
      return currentState;
    });
  }, []);
  
  const reset = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    fullTranscriptRef.current = '';
    setRecognitionState('idle');
  }, []);

  const playAudio = useCallback((audioDataUri: string) => {
    return new Promise<void>((resolve, reject) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioDataUri);
      audioRef.current = audio;
      
      audio.onended = () => {
        resolve();
      };
      audio.onerror = (e) => {
        console.error("Audio element error:", e);
        reject(e);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
          reject(error);
        });
      } else {
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
