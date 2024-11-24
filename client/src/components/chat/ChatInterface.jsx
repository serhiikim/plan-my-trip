import { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import toast from 'react-hot-toast';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

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

  // Processes user input and updates the chat interface
  const processUserInput = async (input) => {
    setIsLoading(true);

    try {
      // Add user's message to the chat
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'user',
        content: input,
        timestamp: new Date()
      }]);

      // Add assistant's typing indicator
      setMessages(prev => [...prev, {
        id: 'typing',
        type: 'assistant',
        isTyping: true
      }]);

      // Get chatbot response
      const response = chatbot.processResponse(input);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      if (!response.isValid) {
        // Display validation error from chatbot
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.message,
          timestamp: new Date()
        }]);

        // Show relevant picker
        if (response.stage === CHAT_STAGES.DATES) {
          setShowDatePicker(true);
        } else if (response.stage === CHAT_STAGES.FLIGHT_DETAILS) {
          setShowFlightPicker(true);
        }
      } else {
        // Update progress bar
        setProgress(calculateProgress(response.stage));

        // Display chatbot's next question
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.message,
          timestamp: new Date()
        }]);

        // Show relevant picker if needed
        if (response.stage === CHAT_STAGES.DATES) {
          setShowDatePicker(true);
        } else if (response.stage === CHAT_STAGES.FLIGHT_DETAILS) {
          setShowFlightPicker(true);
        }

        // Submit travel plan if complete
        if (response.isComplete) {
          const travelData = chatbot.getTravelData();
          await chatService.submitTravelPlan(travelData);
          toast.success("Travel plan data collected! Generating your itinerary...");
          setTimeout(() => {
            navigate('/plan');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');

      // Remove typing indicator in case of error
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
        <Progress value={progress} className={`h-2 ${progress >= 90 ? 'bg-green-500' : progress >= 60 ? 'bg-blue-400' : progress >= 30 ? 'bg-yellow-400' : 'bg-orange-400'}`} /> 
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

        {/* Input & Pickers */}
        <div className="p-4 bg-background border-t space-y-4">
          {showDatePicker && (
            <div className="mb-4">
              <DateRangePicker onSelect={handleDateSelect} />
            </div>
          )}

          {showFlightPicker && (
            <div className="mb-4">
              <FlightDateTimePicker onSelect={handleFlightSelect} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                chatbot.getCurrentQuestion().stage === CHAT_STAGES.FLIGHT_DETAILS
                  ? "Or use the date/time picker above..."
                  : "Type your message..."
              }
              className="flex-1"
              disabled={isLoading || showDatePicker || showFlightPicker}
            />
            <Button
              type="submit"
              disabled={isLoading || showDatePicker || showFlightPicker}
              size="icon"
            >
              <SendHorizontal className={cn(
                "h-4 w-4",
                isLoading && "animate-pulse"
              )} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
