export interface Landmark {
    x: number;
    y: number;
    z: number;
}

export interface HandClassification {
    label: 'Left' | 'Right';
    score: number;
}

export interface Handedness {
    label: 'Left' | 'Right';
}

export interface HandsResults {
    image: HTMLCanvasElement;
    multiHandLandmarks: Landmark[][];
    multiHandedness: Handedness[];
}
