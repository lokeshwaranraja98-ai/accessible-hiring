'use server';
/**
 * @fileOverview A Genkit flow for generating a variety of skill assessment questions.
 *
 * - generateAssessmentQuestions - A function that handles the generation of assessment questions.
 * - GenerateAssessmentQuestionsInput - The input type for the generateAssessmentQuestions function.
 * - GenerateAssessmentQuestionsOutput - The return type for the generateAssessmentQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the question generation
const GenerateAssessmentQuestionsInputSchema = z.object({
  jobRole: z
    .string()
    .describe('The specific job role for which assessment questions need to be generated.'),
  questionFormats: z
    .array(z.enum(['text', 'voice', 'visual']))
    .describe('An array of desired question formats (e.g., "text", "voice", "visual").'),
  numberOfQuestionsPerFormat: z
    .number()
    .int()
    .min(1)
    .max(5) // Limiting to 5 per format to avoid excessive output in a single call
    .describe('The number of questions to generate for each specified format (1-5).')
});
export type GenerateAssessmentQuestionsInput = z.infer<typeof GenerateAssessmentQuestionsInputSchema>;

// Define the schema for a single question output
const QuestionOutputSchema = z.object({
  id: z.string().describe('A unique identifier for the generated question.'),
  format: z
    .enum(['text', 'voice', 'visual'])
    .describe('The format of the question (text, voice, or visual).'),
  questionText: z.string().describe('The core text of the assessment question.'),
  voicePromptContent: z
    .string()
    .optional()
    .describe(
      'The exact text to be used for a voice prompt if the format is "voice". This should be a full sentence or question ready to be spoken.'
    ),
  visualAidDescription: z
    .string()
    .optional()
    .describe(
      'A detailed textual description of the visual aid that should accompany this question, if the format is "visual". This will be used to generate or select an image.'
    ),
  expectedAnswerType: z
    .enum(['text', 'audio', 'image_description', 'code', 'multiple_choice', 'short_answer'])
    .describe('The expected type of answer from the candidate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.')
});

// Define the output schema for the entire generation process
const GenerateAssessmentQuestionsOutputSchema = z.object({
  questions: z.array(QuestionOutputSchema).describe('An array of generated assessment questions.')
});
export type GenerateAssessmentQuestionsOutput = z.infer<typeof GenerateAssessmentQuestionsOutputSchema>;

// Exported wrapper function
export async function generateAssessmentQuestions(
  input: GenerateAssessmentQuestionsInput
): Promise<GenerateAssessmentQuestionsOutput> {
  return aiAssessmentQuestionGenerationFlow(input);
}

// Define the prompt for question generation
const questionGenerationPrompt = ai.definePrompt({
  name: 'generateAssessmentQuestionsPrompt',
  input: {schema: GenerateAssessmentQuestionsInputSchema},
  output: {schema: GenerateAssessmentQuestionsOutputSchema},
  prompt: `You are an expert HR professional and assessment designer. Your task is to generate skill assessment questions for a specific job role, tailored to different formats.

Generate {{numberOfQuestionsPerFormat}} questions for the job role: "{{jobRole}}".
The questions should cover a range of difficulty levels (easy, medium, hard).
For each question, provide a unique 'id', its 'format', the 'questionText', an 'expectedAnswerType', and its 'difficulty'.

Here are the required formats: {{#each questionFormats}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

If the format is "voice", also include 'voicePromptContent' which is the full sentence or question to be spoken.
If the format is "visual", also include 'visualAidDescription' which is a detailed textual description of the image or visual aid that would accompany the question.

Example JSON Structure (do not include example in your actual response, generate directly):
{
  "questions": [
    {
      "id": "q1-text-easy",
      "format": "text",
      "questionText": "Describe the key responsibilities of a Senior Software Engineer.",
      "expectedAnswerType": "short_answer",
      "difficulty": "easy"
    },
    {
      "id": "q2-voice-medium",
      "format": "voice",
      "questionText": "Imagine you encounter a critical bug in production. What are your immediate steps to address it?",
      "voicePromptContent": "Imagine you encounter a critical bug in production. What are your immediate steps to address it?",
      "expectedAnswerType": "audio",
      "difficulty": "medium"
    },
    {
      "id": "q3-visual-hard",
      "format": "visual",
      "questionText": "Analyze the provided system architecture diagram and identify potential single points of failure.",
      "visualAidDescription": "A complex cloud system architecture diagram showing interconnected microservices, databases, load balancers, and a message queue. Highlight potential single points of failure.",
      "expectedAnswerType": "image_description",
      "difficulty": "hard"
    }
  ]
}

Please ensure the generated questions are fair, inclusive, and relevant to the specified job role.
Generate the response directly in JSON format according to the output schema provided.
`
});

// Define the Genkit flow
const aiAssessmentQuestionGenerationFlow = ai.defineFlow(
  {
    name: 'aiAssessmentQuestionGenerationFlow',
    inputSchema: GenerateAssessmentQuestionsInputSchema,
    outputSchema: GenerateAssessmentQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await questionGenerationPrompt(input);
    return output!;
  }
);
