import React, { useEffect, useState } from 'react';

interface ResultPanelAIMobileProps {
    result?: string;
    label?: string;
    clearSignal?: boolean;
}

const ResultPanelAIMobile: React.FC<ResultPanelAIMobileProps> = ({
    result,
    label,
    clearSignal,
}) => {
    const [localResult, setLocalResult] = useState<string>('');

    useEffect(() => {
        if (result) setLocalResult(result);
    }, [result]);

    useEffect(() => {
        if (clearSignal) setLocalResult('');
    }, [clearSignal]);

    return (
        <div className="bg-white rounded-md shadow border border-gray-100 px-2 py-1 text-xs w-full">
            {label && (
                <div className="text-gray-500 text-[10px] font-semibold mb-1 pl-1">
                    {label}
                </div>
            )}
            <div className="overflow-y-auto max-h-32 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent py-1">
                {localResult ? (
                    <span className="text-indigo-800 font-medium text-xs whitespace-pre-line break-words">
                        {localResult}
                    </span>
                ) : (
                    <span className="text-gray-400 italic px-2">
                        Đang chờ kết quả...
                    </span>
                )}
            </div>
        </div>
    );
};

export default ResultPanelAIMobile;
