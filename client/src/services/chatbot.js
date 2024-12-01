export const CHAT_STAGES = {
  DESTINATION: 'destination',
  DATES: 'dates',
  TRAVEL_GROUP: 'travel_group', // New stage
  FLIGHT_BOOKED: 'flight_booked',
  FLIGHT_DETAILS: 'flight_details',
  ACCOMMODATION_BOOKED: 'accommodation_booked',
  ACCOMMODATION_DETAILS: 'accommodation_details',
  INTERESTS: 'interests',
  BUDGET: 'budget',
  TRANSPORTATION: 'transportation',
  COMPLETE: 'complete'
};

export const QUESTIONS = {
    [CHAT_STAGES.DESTINATION]: {
      text: "👋 Welcome! I'll help you plan your perfect trip.\n\n🌎 First, tell me what city and country would you like to visit?\nFor example: 'Paris, France' or 'Tokyo, Japan'",
      nextStage: CHAT_STAGES.DATES,
      validate: (input) => input && input.length > 0,
      errorMessage: "Please specify both city and country, separated by a comma (e.g., 'Rome, Italy')"
    },
    
    [CHAT_STAGES.TRAVEL_GROUP]: {
      text: "👥 Who are you traveling with?\nChoose one: solo, couple, family, friends",
      nextStage: CHAT_STAGES.FLIGHT_BOOKED,
      validate: (input) => {
        if (!input || typeof input !== 'string') return false;
        const validOptions = ['solo', 'couple', 'family', 'friends'];
        return validOptions.includes(input.toLowerCase());
      },
      errorMessage: "Please choose one: solo, couple, family, or friends"
    },

    [CHAT_STAGES.DATES]: {
      text: "📅 When would you like to travel?\nClick the calendar icon to select dates",
      nextStage: CHAT_STAGES.TRAVEL_GROUP,
      validate: (input) => {
        if (!input || typeof input !== 'string') return false;
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}$/;
        return dateRegex.test(input);
      },
      errorMessage: "Please select dates from the calendar",
      showCalendar: true
    },
  
    [CHAT_STAGES.FLIGHT_BOOKED]: {
      text: "✈️ Have you already booked your flights?\nPlease answer 'Yes' or 'No'",
      nextStage: (input) => input.toLowerCase() === 'yes' ? CHAT_STAGES.FLIGHT_DETAILS : CHAT_STAGES.ACCOMMODATION_BOOKED,
      validate: (input) => {
        if (!input || typeof input !== 'string') return false;
        const response = input.toLowerCase();
        return response === 'yes' || response === 'no';
      },
      errorMessage: "Please answer with 'Yes' or 'No'"
    },
  
    [CHAT_STAGES.FLIGHT_DETAILS]: {
      text: "✈️ Please provide your flight details using the date/time picker above",
      nextStage: CHAT_STAGES.ACCOMMODATION_BOOKED,
      validate: (input) => {
        if (!input || typeof input !== 'string') return false;
        
        // Check if input matches the expected format
        const pattern = /^Arrival: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}\nDeparture: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
        
        if (!pattern.test(input)) {
          return false;
        }
    
        // Extract dates and times for validation
        const [arrivalLine, departureLine] = input.split('\n');
        const arrivalDateTime = arrivalLine.replace('Arrival: ', '');
        const departureDateTime = departureLine.replace('Departure: ', '');
    
        // Convert to Date objects
        const arrival = new Date(arrivalDateTime.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5'));
        const departure = new Date(departureDateTime.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5'));
    
        // Check if dates are valid
        if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
          return false;
        }
    
        // Check if departure is after arrival
        return departure > arrival;
      },
      errorMessage: "Please use the date/time picker above",
      showFlightPicker: true
    },
  
    [CHAT_STAGES.ACCOMMODATION_BOOKED]: {
      text: "🏨 Have you already booked your accommodation?\nPlease answer 'Yes' or 'No'",
      nextStage: (input) => input.toLowerCase() === 'yes' ? CHAT_STAGES.ACCOMMODATION_DETAILS : CHAT_STAGES.INTERESTS,
      validate: (input) => {
        if (!input || typeof input !== 'string') return false;
        const response = input.toLowerCase();
        return response === 'yes' || response === 'no';
      },
      errorMessage: "Please answer with 'Yes' or 'No'"
    },
  
    [CHAT_STAGES.ACCOMMODATION_DETAILS]: {
        text: "🏨 Great! Please enter your accommodation name or address:",
        nextStage: CHAT_STAGES.INTERESTS,
        validate: (input) => {
          return input && typeof input === 'string' && input.length > 0;
        },
        errorMessage: "Please enter your accommodation details"
      },

    [CHAT_STAGES.INTERESTS]: {
      text: "🎯 What are your main interests?\nFor example: 'museums, food, shopping'",
      nextStage: CHAT_STAGES.BUDGET,
      validate: (input) => input && input.length > 0,
      errorMessage: "Please list 2-4 interests, separated by commas"
    },

    [CHAT_STAGES.BUDGET]: {
      text: "💰 What's your total budget for this trip?\nFor example: '3000 USD', '2500 EUR', or any other currency",
      nextStage: CHAT_STAGES.TRANSPORTATION,
      validate: (input) => input && input.length > 0,
      errorMessage: "Please provide your budget"
    },

    [CHAT_STAGES.TRANSPORTATION]: {
      text: "🚗 How would you prefer to get around?\nOptions: public transport, car rental, walking, mixed\nFor example: 'public transport' or 'mixed'",
      nextStage: CHAT_STAGES.COMPLETE,
      validate: (input) => {
        if (!input || typeof input !== 'string') return false;
        const validOptions = ['public transport', 'car rental', 'walking', 'mixed'];
        return validOptions.includes(input.toLowerCase());
      },
      errorMessage: "Please choose one of: public transport, car rental, walking, or mixed"
    },

    [CHAT_STAGES.COMPLETE]: {
      text: "✅ Perfect! I have all the information I need. I'll now generate your personalized travel plan.",
      isComplete: true
    }
};

class ChatBotService {
    constructor() {
      this.reset();
    }
  
    reset() {
      this.currentStage = CHAT_STAGES.DESTINATION;
      this.travelData = {
        destination: null,
        dates: null,
        travel_group: null,  // Added this to match your stages
        flight: {
          booked: false,
          details: null
        },
        accommodation: {
          booked: false,
          details: null
        },
        interests: null,
        budget: null,
        transportation: null
      };
      
      // Clear any stored state
      this.lastResponse = null;
      this.isProcessing = false;
    }

    isInitialState() {
      return this.currentStage === CHAT_STAGES.DESTINATION && 
             !this.travelData.destination &&
             !this.isProcessing;
    }
  
    getCurrentQuestion() {
      return {
        ...QUESTIONS[this.currentStage],
        stage: this.currentStage
      };
    }
  
    processResponse(input) {
      const currentQuestion = QUESTIONS[this.currentStage];
      
      try {
        if (currentQuestion.validate && !currentQuestion.validate(input)) {
          return {
            isValid: false,
            message: currentQuestion.errorMessage || "I didn't quite get that. Could you please try again?",
            stage: this.currentStage,
            showCalendar: currentQuestion.showCalendar,
            showFlightPicker: currentQuestion.showFlightPicker
          };
        }
    
        // Store the response based on the stage
        switch (this.currentStage) {
          case CHAT_STAGES.FLIGHT_BOOKED:
            this.travelData.flight.booked = input.toLowerCase() === 'yes';
            break;
          case CHAT_STAGES.FLIGHT_DETAILS:
            this.travelData.flight.details = input;
            break;
          case CHAT_STAGES.ACCOMMODATION_BOOKED:
            this.travelData.accommodation.booked = input.toLowerCase() === 'yes';
            break;
          case CHAT_STAGES.ACCOMMODATION_DETAILS:
            this.travelData.accommodation.details = input;
            break;
          default:
            this.travelData[this.currentStage] = input;
        }
    
        // Get next stage - it could be a function or a direct stage
        this.currentStage = typeof currentQuestion.nextStage === 'function' 
          ? currentQuestion.nextStage(input)
          : currentQuestion.nextStage;
    
        const nextQuestion = QUESTIONS[this.currentStage];
    
        return {
          isValid: true,
          message: nextQuestion.text,
          stage: this.currentStage,
          showCalendar: nextQuestion.showCalendar,
          showFlightPicker: nextQuestion.showFlightPicker,
          isComplete: nextQuestion.isComplete,
          collectedData: this.currentStage === CHAT_STAGES.COMPLETE ? this.travelData : null
        };
      } catch (error) {
        console.error('Error processing response:', error);
        return {
          isValid: false,
          message: "Something went wrong. Please try again.",
          stage: this.currentStage,
          showCalendar: currentQuestion.showCalendar,
          showFlightPicker: currentQuestion.showFlightPicker
        };
      }
    }
  
    isComplete() {
      return this.currentStage === CHAT_STAGES.COMPLETE;
    }
  
    getTravelData() {
      return this.travelData;
    }
}
  
export const chatbot = new ChatBotService();