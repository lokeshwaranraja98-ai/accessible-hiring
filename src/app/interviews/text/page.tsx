"use client";

import { useState, useRef, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiTextInterview } from "@/ai/flows/ai-text-interview-flow";
import type { AITextInterviewInput, AITextInterviewOutput } from "@/ai/flows/ai-text-interview-flow";

type ChatMessage = AITextInterviewOutput["history"][0];

export default function TextInterviewPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", content: "Hello! Welcome to your text-based interview. Let's start with your first question: Can you tell me about your experience relevant to this role?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const interviewInput: AITextInterviewInput = {
        message: input,
        history: messages,
      };
      const result = await aiTextInterview(interviewInput);
      
      if (result.response) {
        const aiMessage: ChatMessage = { role: "model", content: result.response };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error with AI interview:", error);
      const errorMessage: ChatMessage = { role: "model", content: "I'm sorry, I encountered an error. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline">Text Interview</h1>
        <p className="text-muted-foreground">You are now in a text-based interview with our AI assistant.</p>
      </div>
      <div className="flex-1 flex flex-col bg-card border rounded-2xl shadow-lg overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "model" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "p-3 rounded-2xl max-w-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User size={20} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                 <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                  <div className="p-3 rounded-2xl bg-muted rounded-bl-none">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Type your response..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-full h-12 px-6"
              aria-label="Your response"
            />
            <Button type="submit" size="icon" className="rounded-full h-12 w-12" disabled={isLoading}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send Message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
