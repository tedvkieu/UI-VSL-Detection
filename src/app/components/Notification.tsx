import { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    show: boolean;
    duration?: number;
    onClose?: () => void;  // <- thêm prop này
}

export default function Notification({ message, show, duration,onClose  }: NotificationProps) {
  


    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                if (onClose) onClose();  // <- khi hết thời gian thì gọi onClose
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            {message}
        </div>
    );
} 