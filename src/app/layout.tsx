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
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Thêm Mediapipe camera_utils từ CDN */}
                <script
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                    async></script>
                <script
                    src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                    async></script>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
