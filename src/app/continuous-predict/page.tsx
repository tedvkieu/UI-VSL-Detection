'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import HandTrackerContinuous from '../components/HandTrackerContinuous';
import { WebSocketService } from '../services/ws-Service';
import FramePanel from '../components/FramePanel';
import ResultPanel from '../components/ResultPanel';
import ResultPanelAI from '../components/ResultPanelAI';
import Notification from '../components/Notification';
import { useRouter } from 'next/navigation';

const ws = new WebSocketService();

// Restore isLabelMessage type guard
function isLabelMessage(
    msg: unknown
): msg is { label: string; confidence: number; status: string } {
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
    const [resultTracking, setResultTracking] = useState<string>(
        'Đang chờ dữ liệu...'
    );
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const router = useRouter();
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const frameCountRef = useRef<number>(0);
    const hasHandsRef = useRef<boolean>(false);
    const noHandsFrameCountRef = useRef<number>(0);
    const [clearSignal, setClearSignal] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const framesDataRef = useRef<number[][]>([]);
    const [aiGeneratedText, setAiGeneratedText] = useState<string>('');

    // Thêm ref để theo dõi nhãn cuối cùng trong phiên hiện tại
    const lastLabelInCurrentSessionRef = useRef<string | null>(null);
    const isNewSessionRef = useRef<boolean>(true);

    // Xử lý khi nhận được kết quả từ WebSocket
    const handleNewResult = (label: string) => {
        // Kiểm tra xem có phải nhãn trùng lặp trong phiên hiện tại không
        if (
            lastLabelInCurrentSessionRef.current === label &&
            !isNewSessionRef.current
        ) {
            console.log(`Bỏ qua nhãn trùng lặp trong phiên hiện tại: ${label}`);
            return;
        }

        // Cập nhật nhãn cuối cùng và đánh dấu không phải phiên mới
        lastLabelInCurrentSessionRef.current = label;
        isNewSessionRef.current = false;

        setResults((prevResults) => {
            const updated = [...prevResults, label];
            console.log(
                'New result added:',
                label,
                'Updated results:',
                updated
            );
            return updated;
        });
    };

    // Xử lý khi bắt đầu phiên mới (khi phát hiện tay sau khi không có tay)
    const handleNewSession = () => {
        console.log('Bắt đầu phiên mới - reset duplicate prevention');
        isNewSessionRef.current = true;
        lastLabelInCurrentSessionRef.current = null;
    };

    // Gọi AI khi results thay đổi
    useEffect(() => {
        console.log('Results changed:', results);
        if (results.length > 0) {
            //callAI(results);
        } else {
            setAiGeneratedText('');
        }
    }, [results]);

    // Xử lý thay đổi results từ ResultPanel
    const handleResultsChange = (newResults: string[]) => {
        console.log('Results changed from ResultPanel:', newResults);
        setResults(newResults);
    };

    useEffect(() => {
        ws.connect('ws://localhost:8765', (msg: unknown) => {
            console.log('Received message:', msg);

            if (isLabelMessage(msg)) {
                console.log('Valid label message:', msg);

                if (msg.label === 'unknown' || msg.confidence < 0.9) {
                    setNotificationMessage('Chưa hiểu hành động');
                    setShowNotification(true);
                } else {
                    handleNewResult(msg.label);
                }
            }
        });

        return () => {
            ws.close();
        };
    }, []);

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
        }
    };

    // const callAI = async (fullInput: string[]) => {
    //     try {
    //         const inputText = fullInput.join(' ');
    //         const res = await fetch('/api/generate', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ input: inputText }),
    //         });

    //         if (!res.ok) {
    //             const text = await res.text();
    //             console.error('Server error:', text);
    //             throw new Error('Server responded with an error');
    //         }

    //         const data = await res.json();
    //         console.log('AI response:', data);
    //         setAiGeneratedText(data.result);
    //     } catch (err) {
    //         console.error('Error calling AI:', err);
    //         setAiGeneratedText(fullInput.join(' ')); // fallback nếu lỗi
    //     }
    // };

    // Xử lý xóa kết quả
    const clearResults = () => {
        setAiGeneratedText('');
        setResults([]);
        setResultTracking('Đã xóa kết quả, đang chờ dữ liệu mới...');
        setClearSignal(true);

        // Reset duplicate prevention khi xóa kết quả
        lastLabelInCurrentSessionRef.current = null;
        isNewSessionRef.current = true;
    };

    useEffect(() => {
        if (clearSignal) {
            setClearSignal(false);
        }
    }, [clearSignal]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
            {/* Header */}
            <header className="bg-white shadow-md py-4 px-6">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Image
                            src="/taytalk-logo.svg"
                            alt="TayTalk Logo"
                            width={60}
                            height={60}
                            className="h-15 w-auto"
                            priority
                        />
                        <span className="text-xl font-semibold text-indigo-700 pt-1">
                            Vietnamese Sign Language Translator
                        </span>
                    </div>

                    <button
                        onClick={() => router.push('make-data')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md flex items-center space-x-2">
                        <span>Dataset Builder</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Camera Feed */}
                    <div className="flex flex-col space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
                            <h2 className="text-xl font-semibold text-indigo-700 mb-4">
                                Camera Feed
                            </h2>
                            <div className="flex justify-center">
                                <HandTrackerContinuous
                                    isRecording={isRecording}
                                    setIsRecording={setIsRecording}
                                    setResult={setResultTracking}
                                    frameCountRef={frameCountRef}
                                    hasHandsRef={hasHandsRef}
                                    noHandsFrameCountRef={noHandsFrameCountRef}
                                    framesDataRef={framesDataRef}
                                    ws={ws}
                                    sendFrames={sendFramesToPredict}
                                    onNewSession={handleNewSession}
                                />
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className={`h-3 w-3 rounded-full ${
                                            isRecording
                                                ? 'bg-red-500 animate-pulse'
                                                : 'bg-gray-300'
                                        }`}></div>
                                    <span className="text-sm text-gray-600">
                                        {isRecording
                                            ? 'Recording'
                                            : 'Chờ phát hiện cử chỉ tay'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
                            <FramePanel
                                result={resultTracking}
                                label="Trạng thái thu thập"
                            />
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="flex flex-col space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
                            <h2 className="text-xl font-semibold text-indigo-700 mb-4">
                                Bảng Kết Quả Nhận Diện
                            </h2>
                            <div className="mb-6">
                                <ResultPanel
                                    results={results}
                                    label="Dự đoán cử chỉ"
                                    clearSignal={clearSignal}
                                    onResultsChange={handleResultsChange}
                                />
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <h3 className="text-lg font-medium text-indigo-700 mb-2">
                                    AI Translation
                                </h3>
                                <ResultPanelAI
                                    result={aiGeneratedText}
                                    label="Tiếng Việt tự nhiên"
                                    clearSignal={clearSignal}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
                            <h2 className="text-xl font-semibold text-indigo-700 mb-4">
                                Thao Tác
                            </h2>
                            <div className="flex space-x-4">
                                <button
                                    className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow flex items-center justify-center space-x-2"
                                    onClick={clearResults}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>Xóa toàn bộ kết quả</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Notification
                message={notificationMessage}
                show={showNotification}
                duration={500}
                onClose={() => setShowNotification(false)}
            />
        </div>
    );
}
