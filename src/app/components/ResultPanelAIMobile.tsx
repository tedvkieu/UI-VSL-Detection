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
        <div className="bg-white rounded-md shadow border border-gray-100 h-full flex flex-col">
            {label && (
                <div className="text-gray-500 text-[10px] font-semibold p-2 border-b border-gray-100 flex-shrink-0">
                    {label}
                </div>
            )}
            <div className="flex-1 p-2 overflow-y-auto">
                {localResult ? (
                    <span className="text-indigo-800 font-medium text-xs whitespace-pre-line break-words">
                        {localResult}
                    </span>
                ) : (
                    <span className="text-gray-400 italic text-xs">
                        Đang chờ kết quả...
                    </span>
                )}
            </div>
        </div>
    );
};

export default ResultPanelAIMobile;
