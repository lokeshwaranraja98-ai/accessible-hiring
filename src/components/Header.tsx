
"use client";

import Link from 'next/link';
import { Logo } from './Logo';
import { AccessibilityControls } from './AccessibilityControls';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/interviews/job-selection', label: 'Interviews' },
  { href: '/assessment', label: 'Assessments' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href.startsWith('/interviews')) {
      return pathname.startsWith('/interviews');
    }
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                isLinkActive(link.href) ? "text-foreground" : "text-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden md:flex items-center gap-1">
            <AccessibilityControls />
            <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                   Login
                </Link>
            </Button>
            <Button asChild size="sm">
                <Link href="#">
                  Sign Up
                </Link>
            </Button>
          </div>
          
          <div className="flex items-center md:hidden">
            <AccessibilityControls />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open Menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="right">
                <div className="flex flex-col h-full">
                    <div className="border-b p-4">
                        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <Logo />
                        </Link>
                    </div>
                    <div className="flex flex-col flex-1 p-4 space-y-3">
                    {navLinks.map((link) => (
                        <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-lg font-medium transition-colors hover:text-foreground/80",
                            isLinkActive(link.href) ? "text-foreground" : "text-foreground/60"
                        )}
                        >
                        {link.label}
                        </Link>
                    ))}
                    </div>
                    <div className="border-t p-4 space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="#" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                        </Button>
                    </div>
                </div>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
