declare module '@mediapipe/camera_utils/camera_utils.js' {
    export class Camera {
        constructor(videoElement: HTMLVideoElement, options: {
            onFrame: () => Promise<void>;
            width: number;
            height: number;
        });
        start(): void;
    }
}

interface Landmark {
    x: number;
    y: number;
    z: number;
}

interface HandLandmarkResults {
    image: HTMLCanvasElement;
    multiHandLandmarks: Landmark[][];
    multiHandedness: Array<{
        label: string;
    }>;
}

declare module '@mediapipe/hands/hands.js' {
    export const HAND_CONNECTIONS: [number, number][];
    export class Hands {
        constructor(options: {
            locateFile: (file: string) => string;
        });
        setOptions(options: {
            maxNumHands: number;
            modelComplexity: number;
            minDetectionConfidence: number;
            minTrackingConfidence: number;
        }): void;
        onResults(callback: (results: HandLandmarkResults) => void): void;
        send(options: { image: HTMLVideoElement }): Promise<void>;
    }
} 