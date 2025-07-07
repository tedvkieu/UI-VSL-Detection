import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        GROK_API_KEY: z.string().min(1),
        GEMINI_API_KEY: z.string().min(1),
        OPEN_ROUTER_KEY: z.string().min(1),
        HF_TOKEN: z.string().min(1),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
        NEXT_PUBLIC_BACKEND_DOMAIN: z.string().min(1),
    },
    runtimeEnv: {
        GROK_API_KEY: process.env.GROK_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        HF_TOKEN: process.env.HF_TOKEN,
        OPEN_ROUTER_KEY: process.env.OPEN_ROUTER_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_BACKEND_DOMAIN: process.env.NEXT_PUBLIC_BACKEND_DOMAIN,
    },
});
