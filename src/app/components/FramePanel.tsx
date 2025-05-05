import React from 'react';

interface FramePanelProps {
    result: string;
    label: string;
}

export default function FramePanel({ result, label }: FramePanelProps) {
    const extractFrameCount = (text: string): number | null => {
        const match = text.match(/\((\d+) frames\)/);
        return match ? parseInt(match[1], 10) : null;
    };

    const getStatusInfo = (text: string) => {
        if (text.includes('bắt đầu thu thập')) {
            return {
                status: 'collecting',
                icon: 'wave',
                color: 'text-green-500',
                bgColor: 'bg-green-100',
                borderColor: 'border-green-400',
            };
        } else if (text.includes('Đang thu thập')) {
            return {
                status: 'recording',
                icon: 'recording',
                color: 'text-red-500',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-400',
            };
        } else if (text.includes('Đang kiểm tra')) {
            return {
                status: 'checking',
                icon: 'search',
                color: 'text-yellow-500',
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-400',
            };
        } else if (text.includes('Đã gửi')) {
            return {
                status: 'sent',
                icon: 'send',
                color: 'text-blue-500',
                bgColor: 'bg-blue-100',
                borderColor: 'border-blue-400',
            };
        } else if (text.includes('Không phát hiện')) {
            return {
                status: 'waiting',
                icon: 'hand',
                color: 'text-gray-500',
                bgColor: 'bg-gray-100',
                borderColor: 'border-gray-300',
            };
        }

        return {
            status: 'idle',
            icon: 'waiting',
            color: 'text-gray-400',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
        };
    };

    const statusInfo = getStatusInfo(result);
    const frameCount = extractFrameCount(result);

    const icons = {
        wave: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                />
            </svg>
        ),
        recording: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 animate-pulse"
                fill="currentColor"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <circle cx="12" cy="12" r="8" />
            </svg>
        ),
        search: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        ),
        send: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
            </svg>
        ),
        hand: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                />
            </svg>
        ),
        waiting: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
    };

    return (
        <div
            className={`p-4 border rounded-xl flex items-center gap-4 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <div className={`${statusInfo.color}`}>
                {icons[statusInfo.icon as keyof typeof icons]}
            </div>
            <div>
                <p className="font-semibold text-sm text-gray-800">{label}</p>
                <p className="text-xs text-gray-600">{result}</p>
                {frameCount !== null && (
                    <p className="text-xs text-gray-500 mt-1">
                        Frames: {frameCount}
                    </p>
                )}
            </div>
        </div>
    );
}
