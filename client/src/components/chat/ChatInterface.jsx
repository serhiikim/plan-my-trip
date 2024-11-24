import { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Loader2, Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageBubble } from './MessageBubble';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { FlightDateTimePicker } from '@/components/common/FlightDateTimePicker';
import { chatService } from '@/services/chat';
import { chatbot, CHAT_STAGES, QUESTIONS } from '@/services/chatbot';
import { Progress } from "@/components/ui/progress";
import { planApi } from '@/services/api';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const QUICK_REPLIES = {
    [CHAT_STAGES.FLIGHT_BOOKED]: ['Yes', 'No'],
    [CHAT_STAGES.ACCOMMODATION_BOOKED]: ['Yes', 'No'],
    [CHAT_STAGES.TRANSPORTATION]: ['Public Transport', 'Car Rental', 'Walking', 'Mixed'],
    [CHAT_STAGES.TRAVEL_GROUP]: ['Solo', 'Couple', 'Family', 'Friends'],
  };


export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();


  const handlePlanSubmission = async (travelData) => {
    setIsSubmitting(true);
    try {
      setMessages(prev => [...prev, {
        id: 'submitting',
        type: 'assistant',
        content: "Creating your travel plan...",
        timestamp: new Date()
      }]);
  
      // Create the plan
      const response = await chatService.submitTravelPlan(travelData);
  
      setMessages(prev => [...prev, {
        id: 'success',
        type: 'assistant',
        content: "Thank you! Your travel plan has been created and is being generated. Redirecting you to view the progress...",
        timestamp: new Date()
      }]);
  
      // Start generation in background - don't await it
      planApi.generateItinerary(response.planId).catch(error => {
        console.error('Background generation failed:', error);
      });
  
      // Give user time to read the message
      await new Promise(resolve => setTimeout(resolve, 2000));
  
      // Navigate to plan page
      navigate(`/plans/${response.planId}?new=true`, { replace: true });
  
    } catch (error) {
      console.error('Failed to submit travel plan:', error);
      setMessages(prev => prev.filter(msg => msg.id !== 'submitting'));
      setMessages(prev => [...prev, {
        id: 'error',
        type: 'assistant',
        content: "Sorry, there was an error creating your travel plan. Would you like to try again?",
        timestamp: new Date()
      }]);
  
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create travel plan. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Scrolls the chat to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to the latest message whenever the messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initializes the first question on component mount
  useEffect(() => {
    const firstQuestion = chatbot.getCurrentQuestion();
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content: firstQuestion.text,
      timestamp: new Date()
    }]);
    inputRef.current?.focus();
  }, []);

  const calculateProgress = (stage) => {
    // Create an ordered array of stages based on the conversation flow. This is critical.
    const stageOrder = Object.keys(QUESTIONS).filter(key => key !== CHAT_STAGES.COMPLETE); //remove complete stage


    const stages = Object.keys(CHAT_STAGES);
    if (stages.length <= 1) return 100; // Handle case with only one stage
    const currentIndex = stageOrder.indexOf(stage); // Index in the ordered array

    if (currentIndex === -1) return 0; // Handle case where stage is not found

    return Math.round(((currentIndex + 1) / stageOrder.length) * 100);
  };

  // Handles date selection from the date picker
  const handleDateSelect = async (dateRange) => {
    setShowDatePicker(false);
    await processUserInput(dateRange);
  };

  // Handles flight details selection from the flight picker
  const handleFlightSelect = async (flightDetails) => {
    setShowFlightPicker(false);
    await processUserInput(flightDetails);
  };


  const renderQuickReplies = () => {
    const currentStage = chatbot.getCurrentQuestion().stage;
    const options = QUICK_REPLIES[currentStage];

    if (!options) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((option) => (
          <Button
            key={option}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => processUserInput(option)}
            disabled={isLoading || isSubmitting}
          >
            <span>{option}</span>
          </Button>
        ))}
      </div>
    );
  };

  const renderInputSection = () => {
    const currentQuestion = chatbot.getCurrentQuestion();
    
    // Show date picker
    if (showDatePicker) {
      return (
        <div className="mb-4">
          <DateRangePicker onSelect={handleDateSelect} />
        </div>
      );
    }

    // Show flight picker
    if (showFlightPicker) {
      return (
        <div className="mb-4">
          <FlightDateTimePicker onSelect={handleFlightSelect} />
        </div>
      );
    }
    return (
        <>
          {/* Quick Reply Options */}
          {renderQuickReplies()}
  
          {/* Text Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                currentQuestion.stage === CHAT_STAGES.FLIGHT_DETAILS
                  ? "Or use the date/time picker above..."
                  : "Type your message..."
              }
              className="flex-1"
              disabled={isLoading || isSubmitting}
            />
            <Button
              type="submit"
              disabled={isLoading || isSubmitting || !message.trim()}
              size="icon"
            >
              <SendHorizontal className={cn(
                "h-4 w-4",
                (isLoading || isSubmitting) && "animate-pulse"
              )} />
            </Button>
          </form>
        </>
      );
    };

  // Processes user input and updates the chat interface
  const processUserInput = async (input) => {
    setIsLoading(true);

    try {
      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'user',
        content: input,
        timestamp: new Date()
      }]);

      // Show typing indicator
      setMessages(prev => [...prev, {
        id: 'typing',
        type: 'assistant',
        isTyping: true
      }]);

      const response = chatbot.processResponse(input);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      if (!response.isValid) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.message,
          timestamp: new Date()
        }]);

        if (response.stage === CHAT_STAGES.DATES) {
          setShowDatePicker(true);
        } else if (response.stage === CHAT_STAGES.FLIGHT_DETAILS) {
          setShowFlightPicker(true);
        }
      } else {
        setProgress(calculateProgress(response.stage));

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.message,
          timestamp: new Date()
        }]);

        if (response.stage === CHAT_STAGES.DATES) {
          setShowDatePicker(true);
        } else if (response.stage === CHAT_STAGES.FLIGHT_DETAILS) {
          setShowFlightPicker(true);
        }

        if (response.isComplete && !isSubmitting) {
          const travelData = chatbot.getTravelData();
          await handlePlanSubmission(travelData);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again."
      });

      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
    } finally {
      setIsLoading(false);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    await processUserInput(message.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-4 p-4 bg-background rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Travel Plan Setup</h2>
        <Progress value={progress} /> 
        <p className="text-sm text-muted-foreground mt-2">
          {progress === 100 ? 'All information collected!' : `${progress}% complete`}
        </p>
      </div>

      {/* Chat Interface */}
      <Card className="flex-1 overflow-hidden flex flex-col bg-muted/50">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) =>
            msg.isTyping ? (
              <div key="typing" className="flex gap-2 items-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            ) : (
              <MessageBubble key={msg.id} message={msg} />
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="p-4 bg-background border-t space-y-4">
          {renderInputSection()}
        </div>
      </Card>
    </div>
  );
}
