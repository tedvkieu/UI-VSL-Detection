import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../env.mjs';

export async function POST(req: NextRequest) {
    try {
        const { input } = await req.json();

        const apiKey = env.GEMINI_API_KEY;


        const response = await fetch(
            'https://api.grok.xai.com/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'grok-3.3-chat',
                    messages: [
                        {
                            role: 'system',
                            content: `Bạn là một trợ lý AI có nhiệm vụ chuyển đổi câu từ ngôn ngữ ký hiệu sang tiếng Việt tự nhiên.

Nguyên tắc:
- Phải giữ nguyên ý nghĩa gốc, không được dịch sai hoặc tự suy diễn thêm.
- Nếu đầu vào là bảng chữ cái (ví dụ: "A-B-C", hoặc các ký tự rời rạc) thì hãy giữ nguyên, không chuyển đổi.
- Nếu thông tin đầu vào chưa đầy đủ để hình thành một câu hoàn chỉnh (ví dụ: chỉ gồm các từ đơn rời rạc như "ăn - cơm - sáng") thì cũng giữ nguyên, không viết lại.
- Chỉ khi thông tin đã đủ rõ ràng để hình thành một câu tiếng Việt hoàn chỉnh, thì hãy viết lại câu đó thật tự nhiên và đúng ngữ pháp.
Mục tiêu: Giúp người dùng hiểu nội dung của câu ký hiệu một cách tự nhiên nhất mà không làm mất thông tin gốc.`,
                        },
                        {
                            role: 'user',
                            content: input,
                        },
                    ],
                    temperature: 0.7,
                }),
            }
        );

        const result = await response.json();

        const text =
            result.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Không có phản hồi hợp lệ.';

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error('Gemini fetch error:', error);
        return NextResponse.json(
            { result: 'Lỗi khi gọi Gemini AI.' },
            { status: 500 }
        );
    }
}
