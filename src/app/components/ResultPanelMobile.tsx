import React, { useEffect, useState } from 'react';

interface ResultPanelMobileProps {
    results: string[];
    label?: string;
    clearSignal?: boolean;
    onResultsChange: (results: string[]) => void;
}

const ResultPanelMobile: React.FC<ResultPanelMobileProps> = ({
    results,
    label,
    clearSignal,
    onResultsChange,
}) => {
    const [localResults, setLocalResults] = useState<string[]>([]);

    useEffect(() => {
        setLocalResults(results);
    }, [results]);

    useEffect(() => {
        if (clearSignal) {
            setLocalResults([]);
            onResultsChange([]);
        }
    }, [clearSignal, onResultsChange]);

    const handleRemove = (idx: number) => {
        const newResults = localResults.filter((_, i) => i !== idx);
        setLocalResults(newResults);
        onResultsChange(newResults);
    };

    return (
        <div className="bg-white rounded-md shadow border border-gray-100 h-full flex flex-col">
            {label && (
                <div className="text-gray-500 text-[10px] font-semibold p-2 border-b border-gray-100 flex-shrink-0">
                    {label}
                </div>
            )}
            <div className="flex-1 p-2 overflow-y-auto">
                <div className="flex flex-wrap gap-2 overflow-y-auto max-h-full">
                    {localResults.length > 0 ? (
                        localResults.map((res, idx) => (
                            <div
                                key={idx}
                                className="flex items-center bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 text-xs max-w-full">
                                <span className="text-indigo-700 font-medium break-words">
                                    {res}
                                </span>
                                <button
                                    className="ml-2 text-[10px] text-red-400 hover:text-red-600 focus:outline-none flex-shrink-0"
                                    onClick={() => handleRemove(idx)}
                                    title="Xóa">
                                    ✕
                                </button>
                            </div>
                        ))
                    ) : (
                        <span className="text-gray-400 italic text-xs">
                            Đang chờ kết quả...
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultPanelMobile;
