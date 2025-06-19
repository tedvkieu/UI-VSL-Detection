'use client';
import { useRef, useState, useEffect } from 'react';
import HandTrackerCollect from '../components/HandTrackerCollect';
import FramePanel from '../components/FramePanel';
import { useRouter } from 'next/navigation';

export default function MakeData() {
    const [resultTracking, setResultTracking] = useState<string>('Đang chờ dữ liệu...');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [framesData, setFramesData] = useState<number[][]>([]);
    const [label, setLabel] = useState<string>('');
    const [fileIndex, setFileIndex] = useState<number>(1);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const frameCountRef = useRef<number>(0);
    const hasHandsRef = useRef<boolean>(false);
    const noHandsFrameCountRef = useRef<number>(0);
    const framesDataRef = useRef<number[][]>([]);
    const router = useRouter();

    // Cập nhật framesData từ framesDataRef mỗi khi có thay đổi
    useEffect(() => {
        const interval = setInterval(() => {
            if (framesDataRef.current.length > 0) {
                setFramesData([...framesDataRef.current]);
            }
        }, 100); // Cập nhật mỗi 100ms

        return () => clearInterval(interval);
    }, []);

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    const saveFramesToCSV = async (data: number[][]) => {
        if (data.length === 0 || !label) {
            setError('❌ Vui lòng nhập nhãn và thu thập ít nhất một frame');
            return;
        }

        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    label,
                    data,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Lỗi khi lưu dữ liệu');
            }

            setMessage(`✅ ${result.message}`);
            setFileIndex(prev => prev + 1);
            
            // Reset frames data
            framesDataRef.current = [];
            setFramesData([]);
        } catch (err) {
            console.error('Lỗi khi lưu file CSV:', err);
            setError(`❌ Lỗi khi lưu file CSV: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const handleSaveFrames = () => {
        console.log('Saving frames:', framesData);
        saveFramesToCSV(framesData);
    };

    const handleClearFrames = () => {
        framesDataRef.current = [];
        setFramesData([]);
        setMessage('✅ Đã xóa tất cả frames đã thu thập');
        setError('');
    };

    return (
        <>
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow">
                    Quay lại trang chủ
                </button>
            </div>
            <main className="flex min-h-screen bg-gray-100 p-6 justify-center items-center">
                <div className="w-full md:w-2/3 flex justify-center items-center p-4">
                    <HandTrackerCollect
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        setResult={setResultTracking}
                        frameCountRef={frameCountRef}
                        hasHandsRef={hasHandsRef}
                        noHandsFrameCountRef={noHandsFrameCountRef}
                        framesDataRef={framesDataRef}
                        setFramesData={setFramesData}
                    />
                </div>

                <div className="w-full md:w-2/3 flex flex-col items-center space-y-4">
                    <div className="w-full p-4 flex flex-col justify-center">
                        <FramePanel
                            result={resultTracking}
                            label="Thông tin thu thập frame"
                        />
                    </div>
                    
                    <div className="w-full p-4 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Thu thập dữ liệu</h2>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Nhãn dữ liệu:</label>
                            <input
                                type="text"
                                value={label}
                                onChange={handleLabelChange}
                                placeholder="Nhập nhãn (ví dụ: thumbs_up)"
                                className="w-full text-gray-500 p-2 border rounded"
                            />
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-gray-700">Số frames đã thu thập: {framesData.length}</p>
                            <p className="text-gray-700">Số file đã lưu: {fileIndex - 1}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={handleSaveFrames}
                                disabled={framesData.length === 0 || !label}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:bg-gray-400">
                                Lưu frames hiện tại
                            </button>
                            
                            <button
                                onClick={handleClearFrames}
                                disabled={framesData.length === 0}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded disabled:bg-gray-400">
                                Xóa frames
                            </button>
                            <button
                                onClick={() => setIsRecording(!isRecording)}
                                className={`px-4 py-2 rounded ${
                                    isRecording
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}>
                                {isRecording ? 'Dừng thu thập' : 'Bắt đầu thu thập'}
                            </button>
                        </div>
                        
                        {message && (
                            <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded text-green-700">
                                {message}
                            </div>
                        )}
                        
                        {error && (
                            <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded text-red-700">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
