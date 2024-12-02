import OpenAI from 'openai';
import dotenv from 'dotenv';
import { locationService } from '../services/location.js';
import { ObjectId } from 'mongodb';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateTravelPlan(planData) {
  const systemPrompt = `You are an expert travel planner. Your task is to generate a detailed day-by-day itinerary based on user preferences.
  You must respond in valid JSON format with the following structure:
  {
    "destination": "Formatted city, country (e.g., 'New York, USA', 'Malaga, Spain', 'Paris, France')",
    "dailyPlans": [{
      "date": "YYYY-MM-DD",
      "activities": [{
        "time": "HH:MM",
        "duration": "X hours",
        "activity": "Description",
        "location": "Place name (with address if known with certainty) (e.g., 'Louvre Museum', 'Empire State Building, 350 5th Ave', 'Tsukiji Outer Market')",
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
  ${planData.regenerationInstructions ? '- Special instructions provided for regeneration' : ''}

  Location Formatting Rules:
  - If exact address is known with certainty, provide "Place Name, Address"
  - If unsure about exact address, provide only the place name
  - Never use generic descriptions like "Various options" or "Inside the park"
  - For activities in the same venue, specify exact locations (e.g., "Central Park - Belvedere Castle", "Central Park - Boathouse")
  - Use official or commonly known place names
  - For tourist attractions, landmark names are sufficient
  - For restaurants/shops, use establishment name only if address is uncertain
  - Better to be accurate than complete - provide only information you're confident about
  
  Important Budget Rules:
  - ALL costs should be for the entire group, NOT per person(exception is a solo trip)
  - Do not split or show per-person costs
  - Include group tickets/packages where available
  - For couples/families/groups, calculate shared costs (e.g., one hotel room, one taxi)
  
  Important Group Considerations Based on Travel Group Type:
  - Solo: Focus on solo-friendly activities and safety considerations
  - Couple: Include romantic spots and activities suitable for pairs
  - Family: Prioritize family-friendly locations, kid-appropriate activities, and earlier dining times
  - Friends: Focus on social activities, group-friendly venues, and shared experiences`;

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


//TODO Also use sessions for autocomplete to reduce costs
export async function reorganizeDaySchedule({ 
  activities, 
  transportation,
  travelGroup,
  cityContext, 
  date
}) {
  const systemPrompt = `You are an expert travel planner. Your task is to reorganize ONLY the provided activities in ${cityContext}. 

CRITICAL RULES:
1. DO NOT add any new activities
2. DO NOT add any transit activities or travel segments
3. DO NOT split existing activities
4. ONLY reorder and adjust timings of the provided activities
5. Include transit information in the "transportation" field of each activity
6. PRESERVE EXACTLY the "activity" and "location" fields as given in input
7. DO NOT modify or rewrite activity names or locations

REQUIRED FIELD RULES:
- "time" must always be in HH:MM format
- "duration" must always be specified (e.g., "2 hours", "1.5 hours", "45 minutes")
- "cost" must always include a specific value or range (e.g., "€20", "€15-€25", "Free")
- Never use "N/A", "Various", or "TBD" for any field
- For uncertain costs, provide a reasonable estimate range (e.g., "€20-€40")
- For free activities, use "Free" instead of €0 or N/A

You must respond with a JSON object exactly like this:
{
  "activities": [{
    "time": "HH:MM",
    "duration": "X hours",
    "activity": "Description",
    "location": "Place Name",
    "cost": "Estimated cost for entire travel_group",
    "transportation": "Transport details to reach this location",
    "notes": "Additional information"
  }]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: JSON.stringify({
            date,
            cityContext,
            transportation,
            travelGroup,
            activities,
            activityCount: activities.length
          })
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    try {
      const result = JSON.parse(completion.choices[0].message.content);
      const reorganizedActivities = result.activities || result;

      if (!Array.isArray(reorganizedActivities)) {
        throw new Error('Invalid response format from LLM');
      }

      // Create a map of original activities by their unique identifiers
      const originalActivitiesMap = new Map(
        activities.map(activity => [
          `${activity.activity}|${activity.location}`,
          activity
        ])
      );

      // Map reorganized activities while preserving locationData
      return reorganizedActivities.map(newActivity => {
        const key = `${newActivity.activity}|${newActivity.location}`;
        const originalActivity = originalActivitiesMap.get(key);

        if (!originalActivity) {
          console.error('Could not find matching original activity:', newActivity);
          return newActivity;
        }

        return {
          ...newActivity,
          locationData: originalActivity.locationData
        };
      });

    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Generated schedule was not in valid JSON format');
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

