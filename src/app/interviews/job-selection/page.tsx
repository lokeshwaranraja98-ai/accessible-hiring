"use client";

import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Briefcase } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const availableJobs = [
  {
    title: 'Senior Software Engineer',
    description: 'Responsible for developing and maintaining our core platform. Requires expertise in Next.js, React, and TypeScript.',
    href: '/interviews',
  },
  {
    title: 'UX/UI Designer',
    description: 'Design intuitive and accessible interfaces for our users. Strong portfolio in user-centered design is a must.',
    href: '/interviews',
  },
  {
    title: 'Product Manager',
    description: 'Define product vision, strategy, and roadmap. Work closely with engineering and design teams.',
    href: '/interviews',
  },
];

export default function JobSelectionPage() {
  const { isSpeechEnabled, speak, cancelSpeech } = useAccessibility();

  useEffect(() => {
    if (isSpeechEnabled) {
      const pageTitle = "Select a Job Role";
      const pageDescription = "Choose the position you are applying for to start the interview process.";
      const jobList = availableJobs.map(job => `Job available: ${job.title}. Description: ${job.description}.`).join(' ');
      const textToSpeak = `${pageTitle}. ${pageDescription}. ${jobList}`;
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
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline">Select a Job Role</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Choose the position you are applying for to start the interview process.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {availableJobs.map((job) => (
            <Card key={job.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 rounded-2xl">
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline text-2xl text-center">{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-base">{job.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full rounded-full" size="lg">
                  {/* In a real app, you'd pass the job title, e.g., `${job.href}?job=${encodeURIComponent(job.title)}` */}
                  <Link href={job.href}>
                    Select & Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
