"use client";

import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, Mic, Video } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const interviewModes = [
  {
    icon: MessageSquare,
    title: 'Text-Based Interview',
    description: 'Engage in a conversation with our AI interviewer through a chat-like interface. Take your time to respond.',
    href: '/interviews/text',
    cta: 'Start Text Interview',
  },
  {
    icon: Mic,
    title: 'Voice-Based Interview',
    description: 'Speak your answers and listen to questions from our AI. A natural way to showcase your communication skills.',
    href: '/interviews/voice',
    cta: 'Start Voice Interview',
  },
  {
    icon: Video,
    title: 'Sign Language Interview',
    description: 'Use our camera-based interface for a sign language interview. (Note: AI interpretation is a future feature).',
    href: '/interviews/sign-language',
    cta: 'Start Sign Interview',
  },
];

export default function InterviewSelectionPage() {
  const { isSpeechEnabled, speak, cancelSpeech } = useAccessibility();

  useEffect(() => {
    if (isSpeechEnabled) {
      const pageTitle = "Choose Your Interview Mode";
      const pageDescription = "Select the format that allows you to best demonstrate your skills and experience.";
      const modeList = interviewModes.map(mode => `To start the ${mode.title}, say '${mode.cta.toLowerCase()}'.`).join(' ');
      const textToSpeak = `${pageTitle}. ${pageDescription}. ${modeList}`;
      speak(textToSpeak);
    }

    return () => {
      cancelSpeech();
    };
  }, [isSpeechEnabled, speak, cancelSpeech]);

  return (
    <div className="gradient-background py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline">Choose Your Interview Mode</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Select the format that allows you to best demonstrate your skills and experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {interviewModes.map((mode) => (
            <Card key={mode.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 rounded-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                  <mode.icon className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline text-2xl">{mode.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-center text-base">{mode.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full rounded-full" size="lg">
                  <Link href={mode.href} data-voice-command={mode.cta.toLowerCase()}>{mode.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
