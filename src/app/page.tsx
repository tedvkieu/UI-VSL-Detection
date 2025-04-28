'use client';

import { useEffect, useRef, useState } from 'react';
import HandTrackerPredict from './components/HandTrackerPredict';
import ResultPanel from './components/ResultPanel';
import { WebSocketService } from './services/ws-Service';
import FramePanel from './components/FramePanel';
import Notification from './components/Notification';
import { useRouter } from 'next/navigation';

const ws = new WebSocketService();

interface LabelMessage {
    label: string;
    confidence: number;
    status: string;
}

function isLabelMessage(msg: unknown): msg is LabelMessage {
    if (!msg || typeof msg !== 'object') return false;
    
    const message = msg as Record<string, unknown>;
    return (
        'label' in message &&
        'confidence' in message &&
        'status' in message &&
        typeof message.label === 'string' &&
        typeof message.confidence === 'number' &&
        typeof message.status === 'string'
    );
}

export default function Home() {
    const [resultWebSocket, setResultWebSocket] = useState<string>('');
    const [resultTracking, setResultTracking] = useState<string>('Đang chờ dữ liệu...');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const router = useRouter();

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const frameCountRef = useRef<number>(0);
    const hasHandsRef = useRef<boolean>(false);
    const noHandsFrameCountRef = useRef<number>(0);
    const [messages, setMessages] = useState<unknown[]>([]);
    const [clearSignal, setClearSignal] = useState(false);

    // Tham chiếu đến mảng frames (mỗi frame là một mảng 126 phần tử)
    const framesDataRef = useRef<number[][]>([]);

    // Kết nối WebSocket và xử lý tin nhắn
    useEffect(() => {
        ws.connect('ws://localhost:8765', (msg: unknown) => {
            console.log('Received message:', msg);
            setMessages((prev) => [...prev, msg]);
    
            if (isLabelMessage(msg)) {
                console.log('Valid label message:', msg);
                
                if (msg.label === 'unknown' || msg.confidence < 0.9) {
                    setNotificationMessage("Chưa hiểu hành động");
                    setShowNotification(true);
                } else {
                    setResultWebSocket(msg.label);
                }
            } else {
                console.error('Invalid message format:', msg);
            }
        });
    
        return () => {
            ws.close();
        };
    }, []);
    

    // Hàm gửi frames đã thu thập để dự đoán
    const sendFramesToPredict = () => {
        if (framesDataRef.current.length > 0) {
            console.log(
                `Gửi ${framesDataRef.current.length} frames để dự đoán:`,
                framesDataRef.current
            );

            if (ws.isOpen()) {
                ws.send({ frames: framesDataRef.current });
                setResultTracking(
                    `Đã gửi ${framesDataRef.current.length} frames để dự đoán`
                );
            } else {
                console.warn('WebSocket chưa mở, đang đợi kết nối...');
                ws.send({ frames: framesDataRef.current }); // ws-service sẽ queue lại
                setResultTracking(
                    `Đã queue ${framesDataRef.current.length} frames để gửi khi kết nối`
                );
            }

            // Không reset framesDataRef.current ở đây vì đã được reset khi phát hiện tay mới
        }
    };

    // Xử lý xóa kết quả
    const clearResults = () => {
        setResultWebSocket('');
        setResultTracking('Đã xóa kết quả, đang chờ dữ liệu mới...');
        setClearSignal(true);
    };

    useEffect(() => {
        if (clearSignal) {
            setClearSignal(false);
        }
    }, [clearSignal]);

    return (
        <>
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={() => router.push('make-data')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow">
                    Chuyển trang
                </button>
            </div>
            <main className="flex min-h-screen bg-gray-100 p-6 justify-center items-center">
                <div className="w-full md:w-2/3 flex justify-center items-center p-4">
                    <HandTrackerPredict
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        setResult={setResultTracking}
                        frameCountRef={frameCountRef}
                        hasHandsRef={hasHandsRef}
                        noHandsFrameCountRef={noHandsFrameCountRef}
                        framesDataRef={framesDataRef}
                        ws={ws}
                        sendFrames={sendFramesToPredict}
                    />
                </div>

                <div className="w-full md:w-2/3 flex flex-col items-center space-y-4">
                    <div className="w-full p-4 flex flex-col justify-center">
                        <FramePanel
                            result={resultTracking}
                            label="Trạng thái thu thập"
                        />
                    </div>
                    <div className="w-full p-4 flex flex-col justify-center h-50">
                        <ResultPanel
                            result={resultWebSocket}
                            label="Kết quả dự đoán"
                            clearSignal={clearSignal}
                        />
                    </div>
                    <div className="flex space-x-4">
                        <button
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={clearResults}>
                            Xóa kết quả
                        </button>
                    </div>
                </div>
            </main>
            <Notification 
    message={notificationMessage} 
    show={showNotification} 
    duration={3000} 
    onClose={() => setShowNotification(false)}
/>

        </>
    );
}
