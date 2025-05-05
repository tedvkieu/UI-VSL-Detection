// import OpenAI from 'openai';
// import { env } from '../../env.mjs';

// const openai = new OpenAI({
//     apiKey: env.OPENAI_API_KEY,
//     dangerouslyAllowBrowser: true,
// });

// export class OpenAIService {
//     static async generateNaturalText(input: string): Promise<string> {
//         try {
//             const completion = await openai.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'You are a helpful assistant that converts sign language predictions into natural Vietnamese text. Convert the input into a natural, grammatically correct Vietnamese sentence.',
//                     },
//                     {
//                         role: 'user',
//                         content: input,
//                     },
//                 ],
//                 model: 'gpt-3.5-turbo',
//             });

//             return completion.choices[0].message.content || input;
//         } catch (error) {
//             console.error('Error generating text with OpenAI:', error);
//             return input;
//         }
//     }
// }
