export interface Landmark {
    x: number;
    y: number;
    z: number;
}

export interface HandsResults {
    image:
        | HTMLCanvasElement
        | HTMLVideoElement
        | HTMLImageElement
        | ImageBitmap;
    multiHandLandmarks?: Landmark[][];
    multiHandedness?: { label: 'Left' | 'Right' }[];
}
