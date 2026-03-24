"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Bot, User, Loader2 } from "lucide-react";
import { useVoiceProcessor } from "@/hooks/use-voice-processor";
import { processVoiceInterviewResponse } from "@/ai/flows/ai-voice-interview-flow.ts";
import type { AiVoiceInterviewInput } from "@/ai/flows/ai-voice-interview-flow.ts";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/contexts/AccessibilityContext";

type ConversationEntry = {
  speaker: 'user' | 'model';
  text: string;
};

export default function VoiceInterviewPage() {
  const { transcript, finalTranscript, recognitionState, startListening, stopListening, playAudio, reset } = useVoiceProcessor();
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isVoiceControlActive } = useAccessibility();
  const effectRan = useRef(false);

  // Initial AI greeting, runs once on component mount
  useEffect(() => {
    // In React 18's Strict Mode, useEffect runs twice in development.
    // This check prevents the API call from running on the second render.
    if (effectRan.current === true) {
      return;
    }

    const initialGreeting = async () => {
        setIsProcessing(true);
        try {
            const input: AiVoiceInterviewInput = {
                chatHistory: [],
                candidateResponse: "The candidate has just joined the interview.",
            };
            const { audioResponse, textResponse } = await processVoiceInterviewResponse(input);
            setConversation([{ speaker: 'model', text: textResponse }]);
            // Only play audio if an audio response is returned (skips for the initial greeting)
            if (audioResponse) {
              await playAudio(audioResponse);
            }
        } catch (error) {
            console.error("Error during initial greeting:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred. Check the server logs for more details.";
            setConversation([{ speaker: 'model', text: `Sorry, I'm having trouble connecting. Details: ${errorMessage}` }]);
        } finally {
            setIsProcessing(false);
        }
    };
    initialGreeting();

    // The cleanup function sets the ref, preventing the effect from running again on remount.
    return () => {
      effectRan.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleToggleRecording = () => {
    if (recognitionState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };
  
  useEffect(() => {
    if (recognitionState !== 'processing' || !finalTranscript.trim()) {
      return;
    }

    setIsProcessing(true);
    
    setConversation((prevConversation) => {
      const userMessage: ConversationEntry = { speaker: 'user', text: finalTranscript };
      const newConversation = [...prevConversation, userMessage];

      const getAIResponse = async () => {
        try {
          const chatHistory = newConversation.map(entry => ({
            role: entry.speaker,
            content: entry.text,
          }));

          const input: AiVoiceInterviewInput = {
            chatHistory,
            candidateResponse: finalTranscript,
          };

          const { audioResponse, textResponse } = await processVoiceInterviewResponse(input);
          setConversation(prev => [...prev, { speaker: 'model', text: textResponse }]);
          await playAudio(audioResponse);
        } catch (error) {
          console.error("Error processing voice response:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          setConversation(prev => [...prev, { speaker: 'model', text: `I'm sorry, I encountered an error. Details: ${errorMessage}` }]);
        } finally {
          reset();
          setIsProcessing(false);
        }
      };

      getAIResponse();
      
      return newConversation;
    });
  // The dependency array is intentionally kept minimal to avoid infinite loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognitionState, finalTranscript, playAudio, reset]);


  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline">Voice Interview</h1>
        <p className="text-muted-foreground">Speak your answers and listen to our AI assistant.</p>
      </div>

      <div className="flex-1 bg-card border rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {conversation.map((entry, index) => (
              <div key={index} className={cn("flex items-start gap-3", entry.speaker === 'user' ? 'justify-end' : 'justify-start')}>
                {entry.speaker === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />}
                <div className={cn("p-3 rounded-2xl max-w-md", entry.speaker === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  <p>{entry.text}</p>
                </div>
                {entry.speaker === 'user' && <User className="h-6 w-6 text-primary flex-shrink-0 mt-1" />}
              </div>
            ))}
            {recognitionState === 'listening' && (
                <div className="flex items-start gap-3 justify-end">
                     <div className="p-3 rounded-2xl max-w-md bg-primary/80 text-primary-foreground">
                        <p className="italic">{transcript || "Listening..."}</p>
                     </div>
                     <User className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-background flex flex-col items-center justify-center gap-4">
          <Button
            onClick={handleToggleRecording}
            size="lg"
            className="rounded-full w-24 h-24 shadow-lg data-[state=listening]:bg-destructive"
            disabled={isProcessing}
            data-state={recognitionState === 'listening' ? 'listening' : 'idle'}
            data-voice-command={recognitionState === 'listening' ? 'stop recording' : 'start recording'}
          >
            {isProcessing ? (
                <Loader2 className="h-10 w-10 animate-spin" />
            ) : recognitionState === 'listening' ? (
                <MicOff className="h-10 w-10" />
            ) : (
                <Mic className="h-10 w-10" />
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isProcessing
              ? "AI is responding..."
              : recognitionState === 'listening'
              ? `Recording... ${isVoiceControlActive ? 'Say "stop recording" or ' : ''}click to stop`
              : `${isVoiceControlActive ? 'Say "start recording" or ' : ''}click to start recording`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
