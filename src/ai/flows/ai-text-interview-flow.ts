'use server';
/**
 * @fileOverview A Genkit flow for conducting text-based AI interviews.
 *
 * - aiTextInterview - A function that handles the text-based interview process.
 * - AITextInterviewInput - The input type for the aiTextInterview function.
 * - AITextInterviewOutput - The return type for the aiTextInterview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('The role of the speaker (user or model).'),
  content: z.string().describe('The content of the message.'),
});

const AITextInterviewInputSchema = z.object({
  message: z.string().describe("The candidate's current message in the interview."),
  history: z.array(ChatMessageSchema).describe("Previous chat messages in the interview before the current user message."),
});
export type AITextInterviewInput = z.infer<typeof AITextInterviewInputSchema>;

const AITextInterviewOutputSchema = z.object({
  response: z.string().describe("The AI's follow-up question or concluding statement."),
  history: z.array(ChatMessageSchema).describe("The updated chat history including the new user message and AI's response."),
});
export type AITextInterviewOutput = z.infer<typeof AITextInterviewOutputSchema>;

const AITextInterviewPromptInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The complete chat history including the candidate's current message."),
});

const aiTextInterviewPrompt = ai.definePrompt({
  name: 'aiTextInterviewPrompt',
  input: {schema: AITextInterviewPromptInputSchema},
  output: {schema: z.object({response: z.string()})},
  prompt: `You are an AI interviewer for "Accessible Hiring System". Your goal is to conduct a text-based interview with the candidate.
Maintain a friendly, encouraging, and professional tone. Your responses should be concise.

Based on the entire conversation history, ask a relevant follow-up question. If you determine the interview is complete, provide a polite concluding statement. Do not add any conversational filler before your question or statement.

Conversation History:
{{#each history}}
{{this.role}}: {{this.content}}
{{/each}}

Your follow-up question or concluding statement:`,
});

const aiTextInterviewFlow = ai.defineFlow(
  {
    name: 'aiTextInterviewFlow',
    inputSchema: AITextInterviewInputSchema,
    outputSchema: AITextInterviewOutputSchema,
  },
  async (input) => {
    // Prepare the conversation history to send to the prompt, including the current user message.
    const conversationForPrompt = [
      ...input.history,
      {role: 'user', content: input.message},
    ];

    // Call the AI prompt to get a response based on the conversation history.
    const {output} = await aiTextInterviewPrompt({
      history: conversationForPrompt,
    });

    if (!output || !output.response) {
      throw new Error('AI failed to generate a response.');
    }

    // Construct the final history for the output, adding the AI's response.
    const finalHistory = [
      ...conversationForPrompt,
      {role: 'model', content: output.response},
    ];

    return {
      response: output.response,
      history: finalHistory,
    };
  }
);

export async function aiTextInterview(input: AITextInterviewInput): Promise<AITextInterviewOutput> {
  return aiTextInterviewFlow(input);
}
