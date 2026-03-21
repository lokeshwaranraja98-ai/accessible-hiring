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
import { Readable } from 'stream';

const AiVoiceInterviewInputSchema = z.object({
  chatHistory: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The history of the conversation, including previous AI questions and candidate responses.'),
  candidateResponse: z.string().describe('The candidate\'s current response, transcribed from speech to text.'),
  jobDescription: z.string().describe('The job description for the position the candidate is interviewing for.'),
  candidateResume: z.string().describe('The candidate\'s resume or CV.'),
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
 * @param channels Number of audio channels (default: 1).
 * @param rate Sample rate in Hz (default: 24000).
 * @param sampleWidth Sample width in bytes (default: 2).
 * @returns A Promise that resolves to the base64 encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    const readableStream = new Readable();
    readableStream.push(pcmData);
    readableStream.push(null); // No more data
    readableStream.pipe(writer);
  });
}

const interviewPrompt = ai.definePrompt({
  name: 'aiVoiceInterviewPrompt',
  input: { schema: AiVoiceInterviewInputSchema },
  output: { schema: z.object({ textResponse: z.string().describe('The AI interviewer\'s next question or statement.') }) },
  prompt: `You are an AI interviewer for a job position. Your goal is to conduct a professional and fair interview.\n\nJob Description:\n{{{jobDescription}}}\n\nCandidate Resume:\n{{{candidateResume}}}\n\nConversation History:\n{{#each chatHistory}}\n  {{#ifEquals role "user"}}Candidate: {{/ifEquals}}\n  {{#ifEquals role "model"}}Interviewer: {{/ifEquals}}{{{content}}}\n{{/each}}\n\nCandidate's Current Response: {{{candidateResponse}}}\n\nBased on the job description, the candidate's resume, and the conversation history, formulate your next question or a follow-up statement. Maintain a professional tone. Keep your questions concise and relevant. Do not repeat previous questions. Do not end the interview unless explicitly instructed by the user.\n\nInterviewer: `,
});

const aiVoiceInterviewFlow = ai.defineFlow(
  {
    name: 'aiVoiceInterviewFlow',
    inputSchema: AiVoiceInterviewInputSchema,
    outputSchema: AiVoiceInterviewOutputSchema,
  },
  async (input) => {
    // Generate the AI's text response
    const { output: promptOutput } = await interviewPrompt(input);
    const aiTextResponse = promptOutput!.textResponse;

    // Convert the AI's text response to speech
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // You can choose other voices like 'Achernar', 'Ceti', 'Rigel' etc.
          },
        },
      },
      prompt: aiTextResponse,
    });

    if (!media) {
      throw new Error('No audio media returned from TTS model.');
    }

    // Extract PCM data from the data URI
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    // Convert PCM to WAV and get base64 string
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioResponse: 'data:audio/wav;base64,' + wavBase64,
      textResponse: aiTextResponse,
    };
  }
);

export async function processVoiceInterviewResponse(input: AiVoiceInterviewInput): Promise<AiVoiceInterviewOutput> {
  return aiVoiceInterviewFlow(input);
}
