'use client';

import { useEffect, useRef, useState } from 'react';
import HandTrackerPredict from '../components/HandTrackerPredict';
import ResultPanelMobile from '../components/ResultPanelMobile';
import { WebSocketService } from '../services/ws-Service';
import ResultPanelAIMobile from '../components/ResultPanelAIMobile';

const ws = new WebSocketService();

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

export default function MobileLandscapePage() {
    const [resultTracking, setResultTracking] = useState<string>(
        'Đang chờ dữ liệu...'
    );
    const [results, setResults] = useState<string[]>([]);
    const [aiGeneratedText, setAiGeneratedText] = useState<string>('');
    const [clearSignal, setClearSignal] = useState(false);
    const frameCountRef = useRef<number>(0);
    const hasHandsRef = useRef<boolean>(false);
    const noHandsFrameCountRef = useRef<number>(0);
    const framesDataRef = useRef<number[][]>([]);

    // Handle new result from WebSocket
    const handleNewResult = (label: string) => {
        setResults((prevResults) => [...prevResults, label]);
    };

    // Call AI when results change
    useEffect(() => {
        if (results.length > 0) {
            callAI(results);
        } else {
            setAiGeneratedText('');
        }
    }, [results]);

    // Handle results change from ResultPanel
    const handleResultsChange = (newResults: string[]) => {
        setResults(newResults);
    };

    useEffect(() => {
        ws.connect(
            'wss://e87b-123-21-229-51.ngrok-free.app',
            (msg: unknown) => {
                if (isLabelMessage(msg)) {
                    if (msg.label === 'unknown' || msg.confidence < 0.9) {
                        setResultTracking('Chưa hiểu hành động');
                    } else {
                        handleNewResult(msg.label);
                    }
                }
            }
        );
        return () => {
            ws.close();
        };
    }, []);

    const sendFramesToPredict = () => {
        if (framesDataRef.current.length > 0) {
            if (ws.isOpen()) {
                ws.send({ frames: framesDataRef.current });
                setResultTracking(
                    `Đã gửi ${framesDataRef.current.length} frames để dự đoán`
                );
            } else {
                ws.send({ frames: framesDataRef.current });
                setResultTracking(
                    `Đã queue ${framesDataRef.current.length} frames để gửi khi kết nối`
                );
            }
        }
    };

    const callAI = async (fullInput: string[]) => {
        try {
            const inputText = fullInput.join(' ');
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: inputText }),
            });
            if (!res.ok) {
                throw new Error('Server responded with an error');
            }
            const data = await res.json();
            setAiGeneratedText(data.result);
        } catch (err) {
            console.log('err: ', err);
            setAiGeneratedText(fullInput.join(' '));
        }
    };

    // Clear results
    const clearResults = () => {
        setAiGeneratedText('');
        setResults([]);
        setResultTracking('Đã xóa kết quả, đang chờ dữ liệu mới...');
        setClearSignal(true);
    };

    useEffect(() => {
        if (clearSignal) setClearSignal(false);
    }, [clearSignal]);

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-row overflow-hidden">
            {/* Camera 70% */}
            <div className="w-[70vw] h-full flex flex-col items-center justify-center p-2">
                <div className="w-full h-full bg-white rounded-xl shadow-lg flex items-center justify-center border border-indigo-100">
                    <HandTrackerPredict
                        isRecording={true}
                        setIsRecording={() => {}}
                        setResult={setResultTracking}
                        frameCountRef={frameCountRef}
                        hasHandsRef={hasHandsRef}
                        noHandsFrameCountRef={noHandsFrameCountRef}
                        framesDataRef={framesDataRef}
                        ws={ws}
                        sendFrames={sendFramesToPredict}
                    />
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center w-full truncate">
                    {resultTracking}
                </div>
            </div>
            {/* Results 30% */}
            <div className="w-[30vw] h-full flex flex-col items-center justify-center p-2 space-y-4">
                <div className="w-full h-[60vh]">
                    <ResultPanelMobile
                        results={results}
                        label="Kết quả"
                        clearSignal={clearSignal}
                        onResultsChange={handleResultsChange}
                    />
                </div>
                <div className="w-full h-[20vh]">
                    <ResultPanelAIMobile
                        result={aiGeneratedText}
                        label="AI dịch"
                        clearSignal={clearSignal}
                    />
                </div>
                <button
                    className="mt-4 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow text-sm"
                    onClick={clearResults}>
                    Xóa kết quả
                </button>
            </div>
        </div>
    );
}
