import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateTravelPlan(planData) {
  const systemPrompt = `You are an expert travel planner. Your task is to generate a detailed day-by-day itinerary based on user preferences.
  You must respond in valid JSON format with the following structure:
  {
    "dailyPlans": [{
      "date": "YYYY-MM-DD",
      "activities": [{
        "time": "HH:MM",
        "duration": "X hours",
        "activity": "Description",
        "location": "Place name",
        "cost": "Estimated cost",
        "transportation": "How to get there",
        "notes": "Additional information"
      }],
      "dailyCost": "Total cost for the day"
    }],
    "totalCost": "Total trip cost",
    "generalNotes": "Overall trip notes and tips"
  }

  Consider:
  - Opening hours of attractions
  - Travel times between locations
  - Logical geographical flow of activities
  - Group nearby attractions together
  - Local customs and practices
  - Weather-appropriate activities
  - Budget constraints for activities and meals
  ${planData.regenerationInstructions ? '- Special instructions provided for regeneration' : ''}`;

  const userPrompt = `Create a travel plan for:
  Destination: ${planData.destination}
  Dates: ${planData.dates}
  Interests: ${planData.interests}
  Budget: ${planData.budget}
  Travel Group: ${planData.travel_group}
  Transportation: ${planData.transportation}
  ${planData.flight?.booked ? `Flight Details: ${planData.flight.details}` : ''}
  ${planData.accommodation?.booked ? `Accommodation: ${planData.accommodation.details}` : ''}
  ${planData.regenerationInstructions ? `\n\nSpecial Instructions for this plan:\n${planData.regenerationInstructions}` : ''}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  // If this is a regeneration with instructions, add an additional system message
  if (planData.regenerationInstructions) {
    messages.push({
      role: "system",
      content: `Make sure to modify the previous plan according to these special instructions: ${planData.regenerationInstructions}. 
      The changes should be meaningful and clearly reflect the user's requests while maintaining the overall quality and structure of the itinerary.`
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages,
      temperature: planData.regenerationInstructions ? 0.8 : 0.7, // Slightly higher temperature for regeneration to ensure variation
      response_format: { type: "json_object" }
    });

    // Parse the response to ensure it's valid JSON
    try {
      return JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Generated plan was not in valid JSON format');
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Helper function to ensure dates are in correct format
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateString;
  }
}