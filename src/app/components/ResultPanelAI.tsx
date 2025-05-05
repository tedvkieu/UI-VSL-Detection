import React, { useState, useEffect } from 'react';

interface ResultPanelProps {
    result?: string;
    label?: string;
    clearSignal?: boolean; // Tín hiệu xóa từ component cha
}

const ResultPanelAI: React.FC<ResultPanelProps> = ({
    result,
    label,
    clearSignal,
}) => {
    const [results, setResults] = useState<string[]>([]);
    const [fadeIn, setFadeIn] = useState(false);

    // Thêm kết quả mới vào danh sách
    useEffect(() => {
        if (result) {
            setResults((prevResults) => {
                const last = prevResults[prevResults.length - 1];
                if (last !== result) {
                    setFadeIn(true);
                    // Reset fade-in effect after animation
                    setTimeout(() => setFadeIn(false), 600);
                    return [...prevResults, result];
                }
                return prevResults;
            });
        }
    }, [result]);

    // Khi nhận tín hiệu clear từ cha, reset danh sách kết quả
    useEffect(() => {
        if (clearSignal) {
            setResults([]);
        }
    }, [clearSignal]);

    // Generate a unique color for each result
    // const getResultColor = (index: number) => {
    //     const colors = [
    //         'text-indigo-600',
    //         'text-purple-600',
    //         'text-blue-600',
    //         'text-green-600',
    //         'text-teal-600',
    //         'text-cyan-600',
    //     ];
    //     return colors[index % colors.length];
    // };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 text-sm min-h-[100px] transition-all">
            <div className="flex flex-col items-start w-full">
                {label && (
                    <span className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-2">
                        {label}
                    </span>
                )}

                {results.length > 0 ? (
                    <div className="w-full space-y-2">
                        {/* {results.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {results.slice(0, -1).map((res, idx) => (
                                    <span
                                        key={idx}
                                        className={`${getResultColor(
                                            idx
                                        )} bg-gray-50 text-sm px-3 py-1 rounded-full`}>
                                        Đây là nội dung từ AI
                                    </span>
                                ))}
                            </div>
                        )} */}

                        <div
                            className={`w-full ${
                                fadeIn ? 'animate-fade-in' : ''
                            }`}>
                            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                                <span className="font-medium text-indigo-800 text-lg">
                                    {results[results.length - 1]}
                                </span>
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

export default ResultPanelAI;
