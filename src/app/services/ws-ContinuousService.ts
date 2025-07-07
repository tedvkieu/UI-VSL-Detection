type MessageHandler = (msg: any) => void;

export class WebSocketContinuousService {
    private ws: WebSocket | null = null;
    private messageHandler: MessageHandler | null = null;
    private url: string;

    constructor(url = 'ws://localhost:8777') {
        this.url = url;
    }

    connect(onMessage: MessageHandler) {
        this.ws = new WebSocket(this.url);
        this.messageHandler = onMessage;
        this.ws.onopen = () => {
            console.log('[ContinuousWS] Connected');
        };
        this.ws.onmessage = (event) => {
            if (this.messageHandler) {
                try {
                    const data = JSON.parse(event.data);
                    this.messageHandler(data);
                } catch (e) {
                    console.error('WS parse error', e);
                }
            }
        };
        this.ws.onclose = () => {
            console.log('[ContinuousWS] Disconnected');
        };
        this.ws.onerror = (e) => {
            console.error('[ContinuousWS] Error', e);
        };
    }

    sendFrame(frame: number[]) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ frame }));
        }
    }

    resetBuffer() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ reset: true }));
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
} 