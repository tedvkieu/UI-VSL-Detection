import { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    show: boolean;
    duration?: number;
    onClose?: () => void;
}

export default function Notification({
    message,
    show,
    duration = 3000,
    onClose,
}: NotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            setIsLeaving(false);

            const timer = setTimeout(() => {
                setIsLeaving(true);

                setTimeout(() => {
                    if (onClose) onClose();
                }, 300); // Animation duration
            }, duration);

            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [show, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed bottom-6 right-6 flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-lg shadow-xl z-50 transition-all duration-300 transform ${
                isLeaving
                    ? 'opacity-0 translate-y-4'
                    : 'opacity-100 translate-y-0'
            }`}>
            <div className="bg-red-600 bg-opacity-40 p-2 rounded-full">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
            <div>
                <h4 className="font-medium text-white">Notification</h4>
                <p className="text-white text-opacity-90">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="ml-4 text-white text-opacity-80 hover:text-opacity-100 transition-opacity">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
}
