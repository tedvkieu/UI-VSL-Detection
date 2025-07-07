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
    onNewSession: () => void; // Callback khi bắt đầu phiên mới
}

export default function HandTrackerContinuous({
    isRecording,
    setIsRecording,
    setResult,
    frameCountRef,
    hasHandsRef,
    noHandsFrameCountRef,
    framesDataRef,
    ws,
    onNewSession,
}: HandTrackerPredictProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Constants for YOLO-style continuous detection
    const MAX_TIMESTEPS = 30;
    const MIN_TIMESTEPS = 5;
    const PREDICTION_INTERVAL = 500; // Gửi prediction mỗi 500ms

    const MISSING_THRESHOLD = 10;

    // Refs for continuous prediction
    const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastPredictionTimeRef = useRef<number>(0);
    const bufferSizeRef = useRef<number>(0);
    const isCollectingRef = useRef<boolean>(false);

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
            // Có tay được phát hiện
            if (!hasHandsRef.current) {
                hasHandsRef.current = true;
                setIsRecording(true);
                isCollectingRef.current = true;
                framesDataRef.current = [];
                frameCountRef.current = 0;
                setResult('Đã phát hiện tay, bắt đầu thu thập...');

                // Gọi callback để báo hiệu phiên mới bắt đầu
                onNewSession();

                // Bắt đầu continuous prediction
                startContinuousPrediction();
            }

            // Thêm frame vào buffer (rolling buffer style)
            framesDataRef.current.push(keypoints);
            if (framesDataRef.current.length > MAX_TIMESTEPS) {
                framesDataRef.current.shift(); // Remove oldest frame
            }

            frameCountRef.current += 1;
            bufferSizeRef.current = framesDataRef.current.length;
            noHandsFrameCountRef.current = 0;

            // Update status based on buffer size
            if (bufferSizeRef.current < MIN_TIMESTEPS) {
                setResult(
                    `Đang thu thập... (${bufferSizeRef.current}/${MIN_TIMESTEPS})`
                );
            } else {
                setResult(
                    `Đang dự đoán liên tục... (Buffer: ${bufferSizeRef.current}/${MAX_TIMESTEPS})`
                );
            }
        } else {
            // Không phát hiện tay
            if (hasHandsRef.current) {
                noHandsFrameCountRef.current += 1;

                if (noHandsFrameCountRef.current >= MISSING_THRESHOLD) {
                    // Stop continuous prediction và reset
                    stopContinuousPrediction();
                    hasHandsRef.current = false;
                    setIsRecording(false);
                    isCollectingRef.current = false;

                    // Clear buffer sau khi không có tay một thời gian
                    framesDataRef.current = [];
                    frameCountRef.current = 0;
                    bufferSizeRef.current = 0;
                    setResult('Không phát hiện tay - đã dừng dự đoán');
                } else {
                    setResult(
                        `Đang kiểm tra... (${noHandsFrameCountRef.current}/${MISSING_THRESHOLD}) - Buffer: ${bufferSizeRef.current}`
                    );
                }
            } else {
                setResult('Không phát hiện tay');
            }
        }

        drawHandLandmarks(results, canvas, ctx);
        ctx.restore();
    };

    // Continuous prediction function - YOLO style
    const performContinuousPrediction = () => {
        const currentTime = Date.now();

        // Throttle predictions để tránh spam
        if (currentTime - lastPredictionTimeRef.current < PREDICTION_INTERVAL) {
            return;
        }

        if (bufferSizeRef.current >= MIN_TIMESTEPS && isCollectingRef.current) {
            console.log(
                `Continuous prediction - Buffer size: ${bufferSizeRef.current}`
            );

            // Gửi frames hiện tại để dự đoán
            if (ws.isOpen()) {
                const framesToSend = [...framesDataRef.current]; // Copy current buffer
                ws.send({
                    frames: framesToSend,
                    type: 'continuous_prediction',
                    buffer_size: framesToSend.length,
                    timestamp: currentTime,
                });

                console.log(
                    `Đã gửi ${framesToSend.length} frames để dự đoán liên tục`
                );
                lastPredictionTimeRef.current = currentTime;
            } else {
                console.warn('WebSocket chưa mở, đang đợi kết nối...');
            }
        }
    };

    // Start continuous prediction interval
    const startContinuousPrediction = () => {
        if (predictionIntervalRef.current) {
            clearInterval(predictionIntervalRef.current);
        }

        console.log('Bắt đầu dự đoán liên tục...');
        predictionIntervalRef.current = setInterval(
            performContinuousPrediction,
            PREDICTION_INTERVAL
        );
    };

    // Stop continuous prediction
    const stopContinuousPrediction = () => {
        if (predictionIntervalRef.current) {
            clearInterval(predictionIntervalRef.current);
            predictionIntervalRef.current = null;
        }
        console.log('Đã dừng dự đoán liên tục');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopContinuousPrediction();
        };
    }, []);

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

        // Add enhanced recording indicator when active
        if (isRecording) {
            // Main recording dot
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(30, 30, 12, 0, 2 * Math.PI);
            ctx.fill();

            // Pulse ring effect
            const pulseRadius = 20 + Math.sin(Date.now() / 200) * 5;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(30, 30, pulseRadius, 0, 2 * Math.PI);
            ctx.stroke();

            // "LIVE" text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('LIVE', 50, 35);
        }

        // Buffer size indicator
        if (bufferSizeRef.current > 0) {
            const bufferText = `Buffer: ${bufferSizeRef.current}/${MAX_TIMESTEPS}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvas.width - 150, 10, 140, 25);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '12px Arial';
            ctx.fillText(bufferText, canvas.width - 145, 27);

            // Buffer progress bar
            const progressWidth = (bufferSizeRef.current / MAX_TIMESTEPS) * 120;
            ctx.fillStyle =
                bufferSizeRef.current >= MIN_TIMESTEPS
                    ? 'rgba(0, 255, 0, 0.6)'
                    : 'rgba(255, 255, 0, 0.6)';
            ctx.fillRect(canvas.width - 135, 40, progressWidth, 4);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(canvas.width - 135, 40, 120, 4);
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

            {/* Enhanced Status Indicator */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 px-4 py-2 rounded-full z-40 flex items-center space-x-3">
                <div
                    className={`h-3 w-3 rounded-full ${
                        isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                <span className="text-white text-sm font-medium">
                    {isRecording ? 'Continuous Detection' : 'Ready'}
                </span>
                {bufferSizeRef.current > 0 && (
                    <span className="text-yellow-300 text-xs">
                        {bufferSizeRef.current >= MIN_TIMESTEPS
                            ? '⚡ Predicting'
                            : '📊 Collecting'}
                    </span>
                )}
            </div>

            {/* Mode indicator */}
            <div className="absolute top-4 right-4 bg-purple-600 bg-opacity-80 px-3 py-1 rounded-full z-40">
                <span className="text-white text-xs font-medium">
                    YOLO-Style Continuous
                </span>
            </div>
        </div>
    );
}
