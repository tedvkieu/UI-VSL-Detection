'use client';

import { useEffect, useRef } from 'react';
import { useMediapipe } from '../hooks/useMediapipe';
import { HAND_CONNECTIONS } from '../constants/handLandmarks';
import type { Results } from '@mediapipe/hands';
import { WebSocketService } from '../services/ws-Service';

interface HandTrackerPredictProps {
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;
    setResult: (result: string) => void;
    frameCountRef: React.MutableRefObject<number>;
    hasHandsRef: React.MutableRefObject<boolean>;
    noHandsFrameCountRef: React.MutableRefObject<number>;
    framesDataRef: React.MutableRefObject<number[][]>;
    ws: WebSocketService;
    sendFrames: () => void;
}

export default function HandTrackerPredict({
    isRecording,
    setIsRecording,
    setResult,
    frameCountRef,
    hasHandsRef,
    noHandsFrameCountRef,
    framesDataRef,
    ws,
    sendFrames,
}: HandTrackerPredictProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const MISSING_THRESHOLD = 10;

   

    const processResults = (results: Results) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        const keypoints = extractBothHandsLandmarks(results);
        const handDetected = keypoints.some((k) => k !== 0);

        if (handDetected) {
            if (!hasHandsRef.current) {
                hasHandsRef.current = true;
                setIsRecording(true);
                framesDataRef.current = [];
                frameCountRef.current = 0;
                setResult('Đã phát hiện tay, bắt đầu thu thập...');
            }

            framesDataRef.current.push(keypoints);
            frameCountRef.current += 1;
            noHandsFrameCountRef.current = 0;
            setResult(`Đang thu thập... (${frameCountRef.current} frames)`);
        } else {
            if (hasHandsRef.current) {
                noHandsFrameCountRef.current += 1;

                if (noHandsFrameCountRef.current >= MISSING_THRESHOLD) {
                    hasHandsRef.current = false;
                    setIsRecording(false);
                    
                    if (framesDataRef.current.length > 0) {
                        sendFrames();
                        setResult(`Đã gửi ${framesDataRef.current.length} frames để dự đoán và lưu vào file CSV`);
                        framesDataRef.current = [];
                        frameCountRef.current = 0;
                    }
                } else {
                    setResult(
                        `Đang kiểm tra... (${noHandsFrameCountRef.current}/${MISSING_THRESHOLD})`
                    );
                }
            } else {
                setResult('Không phát hiện tay');
            }
        }

        drawHandLandmarks(results, canvas, ctx);
        ctx.restore();
    };

    const { initMediapipe } = useMediapipe(videoRef, processResults);

    useEffect(() => {
        initMediapipe();
    }, []);

    const extractBothHandsLandmarks = (results: Results): number[] => {
        const leftHand = Array(63).fill(0.0);
        const rightHand = Array(63).fill(0.0);

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                const label = handedness.label;
                const coords: number[] = [];
                
                for (const point of landmarks) {
                    coords.push(1 - point.x, point.y, point.z);
                }

                if (label === 'Left') {
                    leftHand.splice(0, coords.length, ...coords);
                } else {
                    rightHand.splice(0, coords.length, ...coords);
                }
            }
        }

        return [...rightHand,...leftHand];
    };

    const drawHandLandmarks = (
        results: Results,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        if (!results.multiHandLandmarks) return;

        results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const handedness = results.multiHandedness?.[index]?.label ?? 'Right';
            const color = handedness === 'Left' ? [0, 255, 0] : [255, 0, 0];

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            for (const [start, end] of HAND_CONNECTIONS) {
                if (landmarks[start] && landmarks[end]) {
                    const startPt = landmarks[start];
                    const endPt = landmarks[end];

                    ctx.beginPath();
                    ctx.moveTo(startPt.x * canvas.width, startPt.y * canvas.height);
                    ctx.lineTo(endPt.x * canvas.width, endPt.y * canvas.height);
                    ctx.stroke();
                }
            }

            for (const pt of landmarks) {
                if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
                    ctx.beginPath();
                    ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    ctx.fill();
                }
            }
        });
    };

    return (
        <div className="relative border-4 border-blue-400 rounded-lg overflow-hidden w-[640px] h-[480px]">
            <video
                ref={videoRef}
                autoPlay
                muted
                className="absolute w-full h-full object-cover transform scale-x-[-1]"
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
            />
        </div>
    );
} 