"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateAssessmentQuestions } from '@/ai/flows/ai-assessment-question-generation-flow';
import type { GenerateAssessmentQuestionsOutput } from '@/ai/flows/ai-assessment-question-generation-flow';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight, FileText, Mic, Image as ImageIcon, Sparkles, AlertTriangle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  jobRole: z.string().min(3, 'Please enter a job role.'),
});

type Question = GenerateAssessmentQuestionsOutput["questions"][0];

export default function AssessmentPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobRole: 'Senior Software Engineer',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const result = await generateAssessmentQuestions({
        jobRole: values.jobRole,
        questionFormats: ['text', 'voice', 'visual'],
        numberOfQuestionsPerFormat: 1,
      });
      setQuestions(result.questions);
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError('There was an error generating the assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const startOver = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setError(null);
  }

  if (questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Safeguard for unexpected states
    if (!currentQuestion) {
      startOver();
      return null;
    }

    const visualAid = currentQuestion.format === 'visual' ? PlaceHolderImages.find(img => img.id === 'system-architecture-diagram') : null;

    return (
      <div className="container mx-auto p-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-xl rounded-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center mb-2">
                <Badge variant={currentQuestion.difficulty === 'easy' ? 'secondary' : currentQuestion.difficulty === 'medium' ? 'default' : 'destructive'} className="capitalize">{currentQuestion.difficulty}</Badge>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    {currentQuestion.format === 'text' && <FileText className="h-4 w-4"/>}
                    {currentQuestion.format === 'voice' && <Mic className="h-4 w-4"/>}
                    {currentQuestion.format === 'visual' && <ImageIcon className="h-4 w-4"/>}
                    <span className="capitalize">{currentQuestion.format} Question</span>
                </div>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full my-4"/>
            <CardTitle className="text-2xl font-headline">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <CardDescription className="text-lg">{currentQuestion.questionText}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.format === 'visual' && visualAid && (
                <div className="w-full aspect-video relative rounded-lg overflow-hidden border">
                    <Image src={visualAid.imageUrl} alt={visualAid.description} fill={true} objectFit="contain" data-ai-hint={visualAid.imageHint}/>
                    <p className="absolute bottom-2 left-2 bg-black/50 text-white text-xs p-1 rounded">{currentQuestion.visualAidDescription}</p>
                </div>
            )}
            {currentQuestion.format === 'voice' && currentQuestion.voicePromptContent && (
                <Alert>
                    <Mic className="h-4 w-4" />
                    <AlertTitle>Voice Prompt</AlertTitle>
                    <AlertDescription>{currentQuestion.voicePromptContent}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-4">
              <Label className="font-bold">Your Answer:</Label>
              {currentQuestion.expectedAnswerType === 'audio' ? (
                <Button variant="outline" className="w-full flex items-center gap-2" size="lg"><Mic/> Record your answer</Button>
              ) : currentQuestion.expectedAnswerType === 'multiple_choice' ? (
                 <RadioGroup defaultValue="option-one">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-one" id="option-one" />
                    <Label htmlFor="option-one">Option One (Placeholder)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-two" id="option-two" />
                    <Label htmlFor="option-two">Option Two (Placeholder)</Label>
                  </div>
                </RadioGroup>
              ) : (
                <Input placeholder="Type your answer here..." className="h-12"/>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
            {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
                <Button onClick={startOver} variant="secondary">Finish & Start Over</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="gradient-background">
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-lg shadow-2xl rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold font-headline flex items-center justify-center gap-2"><Sparkles className="text-primary"/> AI Skill Assessment</CardTitle>
            <CardDescription>Enter a job role to generate a custom assessment.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="jobRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Frontend Developer" {...field} className="h-12 rounded-full px-6" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full rounded-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Generating Questions...' : 'Generate Assessment'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
