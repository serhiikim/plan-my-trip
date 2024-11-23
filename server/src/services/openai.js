// server/src/services/openai.js
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
  - Budget constraints for activities and meals`;

  const userPrompt = `Create a travel plan for:
  Destination: ${planData.destination}
  Dates: ${planData.dates}
  Interests: ${planData.interests}
  Budget: ${planData.budget}
  Transportation: ${planData.transportation}
  ${planData.flight?.booked ? `Flight Details: ${planData.flight.details}` : ''}
  ${planData.accommodation?.booked ? `Accommodation: ${planData.accommodation.details}` : ''}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
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