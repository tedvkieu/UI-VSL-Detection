import React, { useState, useEffect, useRef } from 'react';

interface ResultPanelProps {
    result?: string;
    resultKey?: number;
    label?: string;
    clearSignal?: boolean;
    onResultsChange?: (results: string[]) => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
    result,
    resultKey,
    label,
    clearSignal,
}) => {
    const [results, setResults] = useState<string[]>([]);
    const [fadeIn, setFadeIn] = useState(false);
    const lastResultRef = useRef<{value: string, timestamp: number} | null>(null);

    // Thêm kết quả mới vào danh sách
    useEffect(() => {
        if (result) {
            console.log("ResultPanel received new result:", result, "with key:", resultKey);
            setResults((prevResults) => {
                const newResults = [...prevResults, result];
                console.log("Updated results in ResultPanel:", newResults);
                setFadeIn(true);
                // Reset fade-in effect after animation
                setTimeout(() => setFadeIn(false), 600);
                // Thông báo cho component cha
                return newResults;
            });
        }
    }, [result, resultKey]);

    // Khi nhận tín hiệu clear từ cha, reset danh sách kết quả
    useEffect(() => {
        if (clearSignal) {
            setResults([]);
           
        }
    }, [clearSignal]);

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

    const handleRemoveFadeIn = () => {
        setResults((prevResults) => {
            const newResults = [...prevResults];
            newResults.pop(); 
            return newResults;
        });
    };

    const currentResult = results[results.length - 1];
    const currentResultIndex = results.length - 1;

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
                        {results.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {results.slice(0, -1).map((res, idx) => (
                                    <span
                                        key={`${res}-${idx}`}
                                        className={`${getResultColor(
                                            idx
                                        )} bg-gray-50 text-sm px-3 py-1 rounded-full`}>
                                        {res}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div
                            className={`w-full relative ${
                                fadeIn ? 'animate-fade-in' : ''
                            }`}>
                            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 flex justify-between items-center">
                                <span className={`font-medium text-lg ${getResultColor(currentResultIndex)}`}>
                                    {currentResult}
                                </span>
                                <button
                                    onClick={handleRemoveFadeIn}
                                    className="text-red-500 hover:text-red-700 ml-4"
                                    title="Xoá kết quả mới nhất">
                                    Clear
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