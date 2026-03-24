'use server';
/**
 * @fileOverview A Genkit flow for handling AI-powered voice interviews.
 *
 * - processVoiceInterviewResponse - A function that processes a candidate's voice response
 *   and generates an AI voice question/response.
 * - AiVoiceInterviewInput - The input type for the processVoiceInterviewResponse function.
 * - AiVoiceInterviewOutput - The return type for the processVoiceInterviewResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav'; // Ensure 'wav' package is installed: npm install wav@^1.0.2

const AiVoiceInterviewInputSchema = z.object({
  chatHistory: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The history of the conversation, including previous AI questions and candidate responses.'),
  candidateResponse: z.string().describe('The candidate\'s current response, transcribed from speech to text.'),
});
export type AiVoiceInterviewInput = z.infer<typeof AiVoiceInterviewInputSchema>;

const AiVoiceInterviewOutputSchema = z.object({
  audioResponse: z.string().describe('The AI\'s spoken response as a WAV audio data URI.'),
  textResponse: z.string().describe('The AI\'s response as plain text.'),
});
export type AiVoiceInterviewOutput = z.infer<typeof AiVoiceInterviewOutputSchema>;

/**
 * Converts PCM audio data to WAV format and returns it as a base64 encoded string.
 * @param pcmData The PCM audio data buffer.
 * @returns A Promise that resolves to the base64 encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });

    const buffers: Buffer[] = [];
    writer.on('data', (chunk) => {
      buffers.push(chunk);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(buffers).toString('base64'));
    });
    writer.on('error', reject);
    writer.end(pcmData);
  });
}

const interviewPrompt = ai.definePrompt({
  name: 'aiVoiceInterviewPrompt',
  input: { schema: AiVoiceInterviewInputSchema },
  output: { schema: z.object({ textResponse: z.string().describe('The AI interviewer\'s next question or statement.') }) },
  prompt: `You are a friendly and professional AI interviewer. Your goal is to conduct a fair and effective voice interview. You are the 'model'. The candidate is the 'user'.

The conversation history is provided below.
{{#if chatHistory}}
Conversation History:
{{#each chatHistory}}
- {{this.role}}: {{{this.content}}}
{{/each}}
{{/if}}

The candidate's latest response is: "{{{candidateResponse}}}"

Based on this, formulate your next question or a follow-up statement.
- If the chat history is empty, start with a warm welcome and ask your first question.
- Keep your questions concise, open-ended, and relevant to a typical job interview.
- Do not repeat questions.

Your response:`,
});

const aiVoiceInterviewFlow = ai.defineFlow(
  {
    name: 'aiVoiceInterviewFlow',
    inputSchema: AiVoiceInterviewInputSchema,
    outputSchema: AiVoiceInterviewOutputSchema,
  },
  async (input) => {
    try {
      // 1. Generate the AI's text response
      const { output: promptOutput } = await interviewPrompt(input);
      const aiTextResponse = promptOutput?.textResponse;

      if (!aiTextResponse) {
        throw new Error('AI failed to generate a text response.');
      }

      // 2. Convert the AI's text response to speech
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: aiTextResponse,
      });

      if (!media?.url) {
        throw new Error('No audio media returned from TTS model.');
      }

      // 3. Convert PCM audio to WAV format
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavBase64 = await toWav(audioBuffer);

      return {
        audioResponse: 'data:audio/wav;base64,' + wavBase64,
        textResponse: aiTextResponse,
      };
    } catch (error: any) {
        console.error("[aiVoiceInterviewFlow] Critical Error:", error);
        // Re-throw a more informative error to be caught by the calling page.
        throw new Error(`Failed to process voice interview response. Details: ${error.message}`);
    }
  }
);

export async function processVoiceInterviewResponse(input: AiVoiceInterviewInput): Promise<AiVoiceInterviewOutput> {
  return aiVoiceInterviewFlow(input);
}
