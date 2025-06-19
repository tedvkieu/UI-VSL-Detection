'use client'
import React, { useState, useEffect, useRef } from 'react';

interface ResultPanelProps {
    results: string[]; // Thay đổi: nhận trực tiếp mảng results
    label?: string;
    clearSignal?: boolean;
    onResultsChange: (results: string[]) => void; // Bắt buộc phải có
}

const ResultPanel: React.FC<ResultPanelProps> = ({
    results,
    label,
    clearSignal,
    onResultsChange,
}) => {
    const [localResults, setLocalResults] = useState<string[]>([]);
    const [fadeIn, setFadeIn] = useState(false);

    // Đồng bộ với results từ component cha
    useEffect(() => {
        console.log('ResultPanel received new results:', results);
        
        // Kiểm tra xem có phần tử mới được thêm vào không
        if (results.length > localResults.length) {
            setFadeIn(true);
            setTimeout(() => setFadeIn(false), 600);
        }
        
        setLocalResults(results);
    }, [results]);

    // Xử lý tín hiệu clear từ component cha
    useEffect(() => {
        if (clearSignal) {
            setLocalResults([]);
            onResultsChange([]);
        }
    }, [clearSignal, onResultsChange]);

    // Generate a unique color for each result
    const getResultColor = (index: number) => {
        const colors = [
            'text-indigo-600',
            'text-purple-600',
            'text-blue-600',
            'text-green-600',
            'text-teal-600',
            'text-cyan-600',
        ];
        return colors[index % colors.length];
    };

    // Xóa phần tử cuối cùng
    const handleRemoveLatest = () => {
        const newResults = [...localResults];
        newResults.pop();
        setLocalResults(newResults);
        onResultsChange(newResults);
    };

    // Xóa một phần tử cụ thể
    const handleRemoveItem = (indexToRemove: number) => {
        const newResults = localResults.filter((_, index) => index !== indexToRemove);
        setLocalResults(newResults);
        onResultsChange(newResults);
    };

    const currentResult = localResults[localResults.length - 1];
    const currentResultIndex = localResults.length - 1;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 text-sm min-h-[100px] transition-all">
            <div className="flex flex-col items-start w-full">
                {label && (
                    <span className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-2">
                        {label}
                    </span>
                )}

                {localResults.length > 0 ? (
                    <div className="w-full space-y-2">
                        {localResults.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {localResults.slice(0, -1).map((res, idx) => (
                                    <div
                                        key={`${res}-${idx}`}
                                        className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                                        <span
                                            className={`${getResultColor(idx)} text-sm`}>
                                            {res}
                                        </span>
                                        {/* <button
                                            onClick={() => handleRemoveItem(idx)}
                                            className="text-red-400 hover:text-red-600 text-xs ml-1"
                                            title="Xóa item này">
                                            ×
                                        </button> */}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            className={`w-full relative ${
                                fadeIn ? 'animate-fade-in' : ''
                            }`}>
                            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 flex justify-between items-center">
                                <span
                                    className={`font-medium text-lg ${getResultColor(
                                        currentResultIndex
                                    )}`}>
                                    {currentResult}
                                </span>
                                <button
                                    onClick={handleRemoveLatest}
                                    className="text-red-500 hover:text-red-700 ml-4 px-2 py-1 rounded text-sm"
                                    title="Xóa kết quả mới nhất">
                                    Clear Latest
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-16 text-gray-400 italic">
                        <span>Đang chờ kết quả...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultPanel;