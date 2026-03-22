
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, MessageSquare, Mic, Accessibility, Cpu, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: Accessibility,
      title: 'Adaptive Interface',
      description: 'High contrast, adjustable fonts, and full keyboard navigation for all users.',
    },
    {
      icon: MessageSquare,
      title: 'Text-Based Interviews',
      description: 'Engage in a comfortable, chat-like interview with our AI assistant.',
    },
    {
      icon: Mic,
      title: 'Voice-Based Interviews',
      description: 'Participate in interviews using your voice, with real-time AI interaction.',
    },
    {
      icon: Cpu,
      title: 'Inclusive Assessments',
      description: 'AI-generated skill tests in multiple formats to suit your strengths.',
    },
  ];

  return (
    <div className="gradient-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="text-center py-20 sm:py-28">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground font-headline">
            Welcome to the Future of Hiring.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            An inclusive digital platform that removes barriers and provides equal opportunities for everyone.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/interviews/job-selection">
                Start an Interview <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link href="/assessment">
                Take an Assessment <FileText className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
              A Platform Built for Accessibility
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
              We empower every candidate to showcase their skills without barriers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 rounded-2xl">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="font-headline mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
