import { useState, useEffect } from 'react';
import { Loader2, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
  "Planning your dream itinerary...",
  "Discovering hidden gems...",
  "Finding the best local spots...",
  "Crafting perfect moments...",
  "Planning unforgettable experiences...",
];

const generatingMessages = [
  "AI is analyzing top attractions...",
  "Optimizing your daily schedule...",
  "Considering local weather patterns...",
  "Finding the perfect activity mix...",
  "Adding local insights...",
  "Making sure you don't miss the must-sees...",
];

export const PlanLoader = ({ isGenerating = false }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        (prev + 1) % (isGenerating ? generatingMessages.length : loadingMessages.length)
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="container max-w-4xl py-12">
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-12">
        {/* Animated Plane with Path */}
        <div className="relative w-32 h-32">
          <motion.div
            className="absolute inset-0"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 8,
              ease: "linear",
              repeat: Infinity
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="hsl(var(--primary))" 
                strokeWidth="1" 
                strokeDasharray="3,3"
                className="opacity-20"
              />
            </svg>
          </motion.div>

          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{
              rotate: [0, 0, 180, 180, 360],
              y: [0, -10, 0, 10, 0]
            }}
            transition={{
              duration: 8,
              ease: "linear",
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          >
            <Plane className="h-6 w-6 text-primary" />
          </motion.div>
        </div>

        {/* Title and Loading Messages */}
        <div className="text-center space-y-8">
          <motion.div 
            className="text-2xl font-medium text-primary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            AI Travel Planner
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-6"
            >
              <p className="text-muted-foreground text-lg">
                {isGenerating 
                  ? generatingMessages[currentMessageIndex]
                  : loadingMessages[currentMessageIndex]
                }
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary"
              initial={{ scale: 0.8, opacity: 0.4 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};