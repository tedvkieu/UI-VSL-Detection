'use client';

import { useEffect, useRef, useState } from 'react';
import HandTracker from './components/HandTracker';
import ResultPanel from './components/ResultPanel';
import { WebSocketService } from './services/ws-Service';
import FramePanel from './components/FramePanel';

const ws = new WebSocketService();
const TIMESTEPS = 30;
interface LabelMessage {
    label: string;
    [key: string]: unknown; // cho phép các trường phụ nếu có
}
function isLabelMessage(msg: unknown): msg is LabelMessage {
    return (
        typeof msg === 'object' &&
        msg !== null &&
        'label' in msg &&
        typeof (msg as Record<string, unknown>)['label'] === 'string'
    );
}
export default function Home() {
    const [resultWebSocket, setResultWebSocket] = useState<string>(''); // ban đầu là chuỗi rỗng
    const [resultTracking, setResultTracking] = useState<string>(
        'Đang chờ dữ liệu...'
    );
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [framesData, setFramesData] = useState<number[][]>([]);
    const frameCountRef = useRef<number>(0);
    const hasHandsRef = useRef<boolean>(false);
    const noHandsFrameCountRef = useRef<number>(0);
    const [messages, setMessages] = useState<unknown[]>([]);
    const [clearSignal, setClearSignal] = useState(false);
    const framesDataRef = useRef<number[][]>([]);

    // Kết nối WebSocket và cập nhật chuỗi nhãn liên tục
    useEffect(() => {
        ws.connect('ws://localhost:8765', (msg: unknown) => {
            setMessages((prev) => [...prev, msg]);

            if (isLabelMessage(msg)) {
                console.log('Nhận được nhãn từ WebSocket: ', msg.label);
                setResultWebSocket(msg.label);
            } else {
                console.error(
                    'Dữ liệu không hợp lệ hoặc không có trường label:',
                    msg
                );
            }
        });

        return () => {
            ws.close();
        };
    }, []);

    const clearResults = () => {
        setResultWebSocket('');
        setClearSignal(true); // Gửi tín hiệu xóa
    };

    useEffect(() => {
        if (clearSignal) {
            // Reset tín hiệu sau khi gửi
            setClearSignal(false);
        }
    }, [clearSignal]);

    return (
        <main className="flex min-h-screen bg-gray-100 p-6 justify-center items-center">
            <div className="w-full md:w-2/3 flex justify-center items-center p-4">
                <HandTracker
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    setResult={setResultTracking}
                    frameCountRef={frameCountRef}
                    hasHandsRef={hasHandsRef}
                    noHandsFrameCountRef={noHandsFrameCountRef}
                    framesDataRef={framesDataRef}
                    setFramesData={setFramesData}
                    ws={ws}
                    TIMESTEPS={TIMESTEPS}
                />
            </div>

            <div className="w-full md:w-2/3 flex flex-col items-center space-y-4">
                <div className="w-full p-4 flex flex-col justify-center">
                    <FramePanel
                        result={resultTracking}
                        label="Kết quả từ Tracking"
                    />
                </div>
                <div className="w-full p-4 flex flex-col justify-center h-50">
                    <ResultPanel
                        result={resultWebSocket}
                        label="Kết quả WebSocket"
                        clearSignal={clearSignal}
                    />
                </div>
                <button
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={clearResults}>
                    Xóa tất cả kết quả
                </button>
            </div>
        </main>
    );
}
