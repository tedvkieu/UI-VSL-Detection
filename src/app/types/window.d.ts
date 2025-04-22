interface Window {
    Hands: typeof import('@mediapipe/hands')['Hands'];
    Camera: new (
        videoElement: HTMLVideoElement,
        options: {
            onFrame: () => void;
            width?: number;
            height?: number;
        }
    ) => {
        start: () => void;
    };
}
