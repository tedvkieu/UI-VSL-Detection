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
    sendFrames: () => void;
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
    sendFrames,
}: HandTrackerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Tham số này giống với Python - số frame liên tục không thấy tay để kết thúc một hành động
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
                // Phát hiện tay lần đầu
                hasHandsRef.current = true;
                setIsRecording(true);
                framesDataRef.current = []; // Reset frames mới
                frameCountRef.current = 0;
                setResult('Đã phát hiện tay, bắt đầu thu thập...');
            }

            framesDataRef.current.push(keypoints);
            frameCountRef.current += 1;

            setFramesData([...framesDataRef.current]);

            // Reset đếm số frame không thấy tay
            noHandsFrameCountRef.current = 0;
        } else {
            if (hasHandsRef.current) {
                // Nếu trước đó đang thu thập
                noHandsFrameCountRef.current += 1;

                if (noHandsFrameCountRef.current >= MISSING_THRESHOLD) {
                    // Không thấy tay đủ lâu → kết thúc thu
                    hasHandsRef.current = false;
                    setIsRecording(false);
                    setResult(`Đã thu thập ${framesDataRef.current.length} frames. Nhấn nút Lưu để lưu dữ liệu.`);
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
            for (
                let i = 0;
                i < Math.min(2, results.multiHandLandmarks.length);
                i++
            ) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];

                const label = handedness.label;
                const lm: number[] = [];
                for (const point of landmarks) {
                    lm.push(point.x, point.y, point.z);
                }

                if (label === 'Right') {
                    for (let j = 0; j < Math.min(lm.length, 63); j++)
                        leftHand[j] = lm[j];
                } else if (label === 'Left') {
                    for (let j = 0; j < Math.min(lm.length, 63); j++)
                        rightHand[j] = lm[j];
                }
            }
        }

        return [...leftHand, ...rightHand];
    };

    const handleHandsDetected = (
        results: Results,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        keypoints: number[]
    ) => {
        if (keypoints.length > 0) {
            console.log('Hand detected, keypoints:', keypoints.length);
            framesDataRef.current.push(keypoints);
            console.log('Current frames count:', framesDataRef.current.length);
        }

        noHandsFrameCountRef.current = 0;

        if (!hasHandsRef.current) {
            hasHandsRef.current = true;
            setIsRecording(true);
            framesDataRef.current = [];
            frameCountRef.current = 0;
            setResult('Đang thu thập dữ liệu...');
        }

        framesDataRef.current.push(keypoints);
        frameCountRef.current += 1;
        setFramesData([...framesDataRef.current]);
        drawHandLandmarks(results, canvas, ctx);

        setResult(
            `Đã phát hiện ${
                results.multiHandLandmarks?.length || 0
            } bàn tay | Frame: ${frameCountRef.current}`
        );
    };

    const handleNoHandsDetected = () => {
        // Tăng bộ đếm frame không có tay
        noHandsFrameCountRef.current += 1;

        // Nếu đã thu thập dữ liệu và không phát hiện tay đủ lâu -> kết thúc hành động
        if (
            hasHandsRef.current &&
            noHandsFrameCountRef.current >= MISSING_THRESHOLD
        ) {
            console.log('Kết thúc thu thập do không phát hiện tay đủ lâu');
            hasHandsRef.current = false;

            if (isRecording && framesDataRef.current.length > 0) {
                setIsRecording(false);
                // Gửi dữ liệu thu thập được đến server
                ws.send({ frames: framesDataRef.current });
                setResult(
                    `Đã kết thúc thu thập: ${frameCountRef.current} frames`
                );
                console.log(
                    'Tổng số frames đã thu thập:',
                    frameCountRef.current
                );
                // Lưu dữ liệu frames để hiển thị nếu cần
                setFramesData(framesDataRef.current);

                console.log(
                    'check framessssssssssssssssssssssssssssss: ',
                    framesDataRef.current
                );
                // Reset dữ liệu frames
                framesDataRef.current = [];
            }
        }

        setResult(
            hasHandsRef.current
                ? `Đang tìm kiếm tay... (${noHandsFrameCountRef.current}/${MISSING_THRESHOLD})`
                : 'Không phát hiện bàn tay'
        );
    };

    const drawHandLandmarks = (
        results: Results,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        if (!results.multiHandLandmarks) return;

        results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const handedness =
                results.multiHandedness?.[index]?.label ?? 'Right';
            const color = handedness === 'Left' ? [0, 255, 0] : [255, 0, 0];

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            for (const [start, end] of HAND_CONNECTIONS) {
                if (landmarks[start] && landmarks[end]) {
                    const startPt = landmarks[start];
                    const endPt = landmarks[end];

                    ctx.beginPath();
                    ctx.moveTo(
                        startPt.x * canvas.width,
                        startPt.y * canvas.height
                    );
                    ctx.lineTo(endPt.x * canvas.width, endPt.y * canvas.height);
                    ctx.stroke();
                }
            }

            for (const pt of landmarks) {
                if (
                    pt &&
                    typeof pt.x === 'number' &&
                    typeof pt.y === 'number'
                ) {
                    ctx.beginPath();
                    ctx.arc(
                        pt.x * canvas.width,
                        pt.y * canvas.height,
                        5,
                        0,
                        2 * Math.PI
                    );
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