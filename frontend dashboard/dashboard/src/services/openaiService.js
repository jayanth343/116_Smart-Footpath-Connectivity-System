import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

// System context for the footpath monitoring assistant
const SYSTEM_CONTEXT = `You are an AI assistant for a government footpath monitoring system. You help municipal authorities manage and monitor footpath conditions across the city.

Current system data:
- 85 Active Issues
- 142 Issues Resolved This Month  
- 23 Issues In Progress
- Average Response Time: 4.8 hours
- Resolution Rate: 87%
- Citizen Satisfaction: 4.2/5
- 12 Active Contractors
- 5 Pending Contractor Proposals
- Budget: ₹2.4L This Quarter

You can help with:
- Issue management and tracking
- Statistical analysis and reports
- Contractor and vendor information
- Budget and cost analysis
- Process explanations
- System navigation
- General municipal queries
- Accessibility compliance
- Quality assurance procedures

Be helpful, professional, and provide specific actionable information when possible. Keep responses concise but informative.`;

export const getChatResponse = async (userMessage, conversationHistory = []) => {
  try {
    // Prepare messages for the API
    const messages = [
      { role: 'system', content: SYSTEM_CONTEXT },
      // Include recent conversation history for context
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Fallback responses for different error types
    if (error.code === 'insufficient_quota') {
      return "I'm currently experiencing quota limitations. Please try again later or contact your system administrator.";
    } else if (error.code === 'invalid_api_key') {
      return "API configuration error. Please contact your system administrator.";
    } else if (error.message?.includes('network')) {
      return "I'm having trouble connecting to my AI service. Please check your internet connection and try again.";
    } else {
      return "I'm experiencing technical difficulties right now. You can still use the predefined responses or try again in a moment.";
    }
  }
};

// Fallback function for when API is unavailable
export const getFallbackResponse = (userMessage) => {
  const lowercaseMessage = userMessage.toLowerCase();
  
  if (lowercaseMessage.includes('issue') || lowercaseMessage.includes('problem')) {
    return "I can help you with footpath issues! Currently, there are 85 active issues in the system. You can view detailed information by going to the Issue Dashboard. Would you like me to explain the severity levels or help you understand the reporting process?";
  }
  
  if (lowercaseMessage.includes('statistics') || lowercaseMessage.includes('stats')) {
    return "Here are the current statistics:\n• 85 Active Issues\n• 142 Issues Resolved This Month\n• 23 Issues In Progress\n• Average Response Time: 4.8 hours\n• Resolution Rate: 87%\n• Citizen Satisfaction: 4.2/5\n\nWould you like more detailed analytics on any specific metric?";
  }
  
  if (lowercaseMessage.includes('contractor') || lowercaseMessage.includes('external')) {
    return "We currently have 12 active contractors and 5 pending proposals. External contractors can submit repair bids through our portal. The average contractor response time is 2.3 days. Would you like information about the contractor evaluation process?";
  }
  
  return "I understand you're asking about: '" + userMessage + "'. I'm currently running in fallback mode. Please try again or contact your administrator for full AI capabilities.";
};
