export class WebSocketService {
    private socket: WebSocket | null = null;

    connect(url: string, onMessage: (msg: unknown) => void) {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('✅ Đã kết nối WebSocket');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (err) {
                console.error('❌ Không parse được JSON:', err);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket lỗi:', error);
        };

        this.socket.onclose = () => {
            console.log('🔌 WebSocket đã đóng');
        };
    }

    send(data: unknown) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('⚠️ WebSocket chưa sẵn sàng để gửi dữ liệu');
        }
    }

    close() {
        this.socket?.close();
    }
}
