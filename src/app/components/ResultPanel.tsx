import React, { useState, useEffect } from 'react';

interface ResultPanelProps {
    result?: string;
    label?: string;
    clearSignal?: boolean; // Tín hiệu xóa từ component cha
}

const ResultPanel: React.FC<ResultPanelProps> = ({
    result,
    label,
    clearSignal,
}) => {
    const [results, setResults] = useState<string[]>([]);

    // Thêm kết quả mới vào danh sách
    // const addResult = (newResult: string) => {
    //     setResults((prevResults) => [...prevResults, newResult]);
    // };

    useEffect(() => {
        if (result) {
            setResults((prevResults) => {
                const last = prevResults[prevResults.length - 1];
                if (last !== result) {
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

    return (
        <div className="bg-white h-full shadow-md rounded-lg p-6 text-sm min-h-[64px] text-gray-500">
            <div className="flex flex-col items-start w-full">
                {label && (
                    <span className="font-medium text-gray-700 mb-1">
                        {label}
                    </span>
                )}
                {results.length > 0 ? (
                    <span className="text-green-600">
                        {results.join(' - ')}
                    </span>
                ) : (
                    <span className="italic text-gray-400">
                        Đang chờ kết quả...
                    </span>
                )}
            </div>
        </div>
    );
};

export default ResultPanel;
