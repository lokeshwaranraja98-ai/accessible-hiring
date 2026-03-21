import { Accessibility } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Accessibility className="h-6 w-6 text-primary" />
      <span className="font-bold text-lg font-headline">Accessible Hire</span>
    </div>
  );
}
