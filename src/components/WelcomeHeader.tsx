import { useState, useEffect } from 'react';

const welcomeMessages = [
  "Welcome back! How can I help you today?",
  "Ask me anything about your expenses",
  "Ready to analyze your financial data",
  "What would you like to know?",
  "I'm here to help with your questions",
  "Let's explore your expense insights together"
];

export const WelcomeHeader = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length);
        setIsVisible(true);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
        ExpenseTracker AI
      </h1>
      <p 
        className={`text-lg text-muted-foreground transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {welcomeMessages[currentMessageIndex]}
      </p>
    </div>
  );
};