import React from 'react';

interface SafeScreenProps {
  children: React.ReactNode;
  className?: string;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-console-bg flex flex-col items-center justify-start overflow-x-hidden selection:bg-console-accent selection:text-white">
      <main className={`w-full max-w-lg min-h-screen min-h-[100dvh] flex flex-col pt-safe pb-24 px-4 relative ${className}`}>
        {children}
      </main>
    </div>
  );
};

