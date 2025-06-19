import { MutableRefObject } from 'react';
import { Results } from '@mediapipe/hands';

export function useMediapipe(
    videoRef: MutableRefObject<HTMLVideoElement | null>,
    onResults: (results: Results) => void
) {
    const initMediapipe = async () => {
        if (!window.Hands || !videoRef.current) return;

        const hands = new window.Hands({
            locateFile: (file: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5, // giống với Python
            minTrackingConfidence: 0.5, // giống với Python
        });

        hands.onResults(onResults);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                const camera = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (videoRef.current) {
                            await hands.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });

                camera.start();
            }
        } catch (error) {
            console.error('Không thể truy cập camera:', error);
        }
    };

    return { initMediapipe };
}
