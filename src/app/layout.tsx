import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata = {
    title: 'Hand Tracking',
    description: 'Realtime Mediapipe Hand Tracking',
    icons: {
        icon: '/taytalk-logo_3.svg', // hoặc /favicon.ico
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Load MediaPipe libraries in the correct order */}
                <script type="module"
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                    defer></script>
                <script type="module"
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                    defer></script>
                <script type="module"
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                    defer></script>
                <script type="module"
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"
                    defer></script>
                <script type="module"
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js"
                    defer></script>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
