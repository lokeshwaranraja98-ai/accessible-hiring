"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, VideoOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignLanguageInterviewPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      videoRef.current!.srcObject = null;
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check your browser permissions.");
        setIsCameraOn(false);
      }
    }
  };
  
  useEffect(() => {
    // Clean up camera stream when component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline">Sign Language Interview</h1>
        <p className="text-muted-foreground">This is a placeholder for the sign language interview.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="h-full w-full shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0 h-full flex items-center justify-center bg-black">
              <video ref={videoRef} autoPlay playsInline muted className={cn("h-full w-full object-cover", { 'hidden': !isCameraOn })}></video>
              {!isCameraOn && (
                <div className="text-center text-muted-foreground">
                  <Video className="h-24 w-24 mx-auto" />
                  <p className="mt-2">Your camera is off</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex-grow shadow-lg rounded-2xl overflow-hidden">
             <CardContent className="p-0 h-full flex items-center justify-center bg-muted/50">
                <div className="text-center text-muted-foreground">
                    <p className="font-semibold">Interviewer</p>
                    <p className="text-sm">(Placeholder)</p>
                </div>
             </CardContent>
          </Card>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={toggleCamera} className="w-full rounded-full" size="lg">
              {isCameraOn ? <VideoOff className="mr-2 h-5 w-5" /> : <Video className="mr-2 h-5 w-5" />}
              {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            </Button>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Feature Coming Soon</AlertTitle>
              <AlertDescription>
                Live AI interpretation for sign language is under development. This interface serves as a demonstration of the camera layout.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
