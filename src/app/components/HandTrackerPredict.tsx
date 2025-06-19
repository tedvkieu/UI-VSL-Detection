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
                        setResult(
                            `Đã gửi ${framesDataRef.current.length} frames để dự đoán và lưu vào file CSV`
                        );
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        return [...rightHand, ...leftHand];
    };

    const drawHandLandmarks = (
        results: Results,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        if (!results.multiHandLandmarks) return;

        results.multiHandLandmarks.forEach(
            (
                landmarks: { x: number; y: number; z: number }[],
                index: number
            ) => {
                const handedness =
                    results.multiHandedness?.[index]?.label ?? 'Right';

                ctx.lineWidth = 3;
                for (const [start, end] of HAND_CONNECTIONS) {
                    if (landmarks[start] && landmarks[end]) {
                        const startPt = landmarks[start];
                        const endPt = landmarks[end];

                        const gradient = ctx.createLinearGradient(
                            startPt.x * canvas.width,
                            startPt.y * canvas.height,
                            endPt.x * canvas.width,
                            endPt.y * canvas.height
                        );

                        if (handedness === 'Left') {
                            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.7)');
                            gradient.addColorStop(1, 'rgba(0, 196, 255, 0.7)');
                        } else {
                            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
                            gradient.addColorStop(1, 'rgba(255, 153, 0, 0.7)');
                        }

                        ctx.strokeStyle = gradient;
                        ctx.beginPath();
                        ctx.moveTo(
                            startPt.x * canvas.width,
                            startPt.y * canvas.height
                        );
                        ctx.lineTo(
                            endPt.x * canvas.width,
                            endPt.y * canvas.height
                        );
                        ctx.stroke();
                    }
                }

                // Draw landmarks with glow effect
                for (const pt of landmarks) {
                    if (
                        pt &&
                        typeof pt.x === 'number' &&
                        typeof pt.y === 'number'
                    ) {
                        // Glow effect
                        ctx.shadowColor =
                            handedness === 'Left'
                                ? 'rgba(0, 255, 0, 0.8)'
                                : 'rgba(255, 0, 0, 0.8)';
                        ctx.shadowBlur = 10;

                        // Draw joint
                        ctx.beginPath();
                        ctx.arc(
                            pt.x * canvas.width,
                            pt.y * canvas.height,
                            6,
                            0,
                            2 * Math.PI
                        );
                        ctx.fillStyle =
                            handedness === 'Left'
                                ? 'rgba(0, 255, 0, 0.8)'
                                : 'rgba(255, 0, 0, 0.8)';
                        ctx.fill();

                        // Reset shadow
                        ctx.shadowBlur = 0;
                    }
                }
            }
        );

        // Add recording indicator when active
        if (isRecording) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(30, 30, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    return (
        <div className="relative rounded-xl overflow-hidden w-full aspect-[4/3] max-w-[640px] mx-auto shadow-2xl">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 p-1 rounded-xl z-0">
                <div className="absolute inset-0 bg-black rounded-lg"></div>
            </div>

            {/* Waiting for camera overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-white text-opacity-50 text-lg font-medium">
                    {!videoRef.current ? 'Initializing camera...' : ''}
                </div>
            </div>

            <video
                ref={videoRef}
                autoPlay
                muted
                className="absolute w-full h-full object-cover transform scale-x-[-1] rounded-lg z-20"
            />

            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute top-0 left-0 w-full h-full transform scale-x-[-1] rounded-lg z-30"
            />

            {/* Status Indicator */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-4 py-2 rounded-full z-40 flex items-center space-x-2">
                <div
                    className={`h-3 w-3 rounded-full ${
                        isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                <span className="text-white text-sm font-medium">
                    {isRecording ? 'Recording' : 'Ready'}
                </span>
            </div>
        </div>
    );
}
