'use client';

import { useEffect, useRef } from 'react';
import { useMediapipe } from '../hooks/useMediapipe';
import { WebSocketService } from '../services/ws-Service';
import { HAND_CONNECTIONS } from '../constants/handLandmarks';
import type { Results } from '@mediapipe/hands';

interface HandTrackerProps {
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;
    setResult: (result: string) => void;
    frameCountRef: React.MutableRefObject<number>;
    hasHandsRef: React.MutableRefObject<boolean>;
    noHandsFrameCountRef: React.MutableRefObject<number>;
    framesDataRef: React.MutableRefObject<number[][]>;
    setFramesData: (data: number[][]) => void;
    ws: WebSocketService;
    TIMESTEPS: number;
}

export default function HandTracker({
    isRecording,
    setIsRecording,
    setResult,
    frameCountRef,
    hasHandsRef,
    noHandsFrameCountRef,
    framesDataRef,
    setFramesData,
    ws,
    TIMESTEPS,
}: HandTrackerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const processResults = (results: Results) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
        ) {
            handleHandsDetected(results, canvas, ctx);
        } else {
            handleNoHandsDetected();
        }

        ctx.restore();
    };

    const { initMediapipe } = useMediapipe(videoRef, processResults); // ✅ gọi hook ở cấp component

    useEffect(() => {
        initMediapipe();
    }, []);

    // --- Các hàm xử lý tay giữ nguyên ---
    const handleHandsDetected = (
        results: Results,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        if (!hasHandsRef.current) {
            hasHandsRef.current = true;
            setIsRecording(true);
            setFramesData([]);
            frameCountRef.current = 0;
            setResult('Đang thu thập dữ liệu...');
        }
        noHandsFrameCountRef.current = 0;

        if (hasHandsRef.current) {
            processFrameData(results);
        }

        drawHandLandmarks(results, canvas, ctx);

        setResult(
            `Đã phát hiện ${results.multiHandLandmarks.length} bàn tay | Frame: ${frameCountRef.current}`
        );
    };

    const processFrameData = (results: Results) => {
        const emptyLeftHand = Array(63).fill(0);
        const emptyRightHand = Array(63).fill(0);

        let leftHandData = [...emptyLeftHand];
        let rightHandData = [...emptyRightHand];

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i]?.label; // 'Left' hoặc 'Right'

                // Bỏ qua nếu landmark không đủ
                if (!landmarks || landmarks.length !== 21) continue;

                const coords: number[] = [];
                for (let lm of landmarks) {
                    coords.push(lm.x, lm.y, lm.z); // bạn có thể nhân thêm theo width/height nếu muốn scale theo ảnh
                }

                if (handedness === 'Left') {
                    leftHandData = coords;
                } else if (handedness === 'Right') {
                    rightHandData = coords;
                }
            }
        }

        const frameData = [...leftHandData, ...rightHandData]; // 126 giá trị
        framesDataRef.current.push(frameData);
        frameCountRef.current += 1;

        if (framesDataRef.current.length >= TIMESTEPS) {
            const dataToSend = { frames: framesDataRef.current };
            ws.send(dataToSend);
            setFramesData(framesDataRef.current);
            framesDataRef.current = [];
        }
    };

    const drawHandLandmarks = (
        results: Results,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const handedness =
                results.multiHandedness?.[index]?.label ?? 'Right';
            const pointColor = handedness === 'Left' ? 'blue' : 'green';

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            for (const [start, end] of HAND_CONNECTIONS) {
                const startPt = landmarks[start];
                const endPt = landmarks[end];
                ctx.beginPath();
                ctx.moveTo(startPt.x * canvas.width, startPt.y * canvas.height);
                ctx.lineTo(endPt.x * canvas.width, endPt.y * canvas.height);
                ctx.stroke();
            }

            for (const pt of landmarks) {
                ctx.beginPath();
                ctx.arc(
                    pt.x * canvas.width,
                    pt.y * canvas.height,
                    5,
                    0,
                    2 * Math.PI
                );
                ctx.fillStyle = pointColor;
                ctx.fill();
            }
        });
    };

    const handleNoHandsDetected = () => {
        noHandsFrameCountRef.current += 1;

        if (hasHandsRef.current && noHandsFrameCountRef.current > 10) {
            console.log('Triggering end of recording...');
            hasHandsRef.current = false;

            if (isRecording) {
                console.log('hiiiiiiiiiiiiii');
                setIsRecording(false);
                ws.send({ frames: framesDataRef.current });
                setResult(
                    `Đã kết thúc thu thập: ${frameCountRef.current} frames`
                );
                console.log('frames: ', frameCountRef.current);
                setFramesData(framesDataRef.current);
                framesDataRef.current = [];
            }
        }

        setResult(
            hasHandsRef.current
                ? `Đang tìm kiếm tay... (${noHandsFrameCountRef.current}/10)`
                : 'Không phát hiện bàn tay'
        );
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
