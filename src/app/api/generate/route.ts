import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../env.mjs';

export async function POST(req: NextRequest) {
    try {
        const { input } = await req.json();
        console.log('Check input: ', input);
        const apiKey = env.OPEN_ROUTER_KEY;

        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'X-Title': 'VSL-Sign-App', // Tên app (tùy chọn)
                },
                body: JSON.stringify({
                    model: 'moonshotai/kimi-dev-72b:free',
                    messages: [
                        {
                            role: 'system',
                            content: `Bạn là một trợ lý AI có nhiệm vụ chuyển đổi câu từ ngôn ngữ ký hiệu sang tiếng Việt tự nhiên.
Nguyên tắc:
- Phải giữ nguyên ý nghĩa gốc, không được dịch sai hoặc tự suy diễn vượt quá ngữ cảnh.
- Nếu đầu vào là các ký tự rời rạc tạo thành tên riêng (ví dụ: "K I Ê U") thì hãy ghép lại thành một từ (→ "KIÊU").
- Nếu có các cụm số (ví dụ: "2 2") trong ngữ cảnh giới thiệu bản thân, hãy hiểu đó là tuổi và viết thành "22 tuổi".
- Nếu có địa danh không có giới từ (ví dụ: "Sống Ninh Thuận"), hãy viết lại thành "Sống ở Ninh Thuận".
- Nếu thông tin chưa đủ rõ ràng để hình thành một câu hoàn chỉnh, thì giữ nguyên.
- Khi thông tin đủ rõ ràng, hãy viết lại thành câu tiếng Việt tự nhiên, đúng ngữ pháp và dễ hiểu.
Mục tiêu: Giúp người dùng hiểu nội dung của câu ký hiệu một cách tự nhiên nhất mà không làm mất thông tin gốc.`,
                        },
                        {
                            role: 'user',
                            content: input,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 200,
                }),
            }
        );

        const result = await response.json();
        console.log('Check result: ', result);
        const text =
            result.choices?.[0]?.message?.content ??
            'Không có phản hồi hợp lệ.';

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error('OpenRouter fetch error:', error);
        return NextResponse.json(
            { result: 'Lỗi khi gọi OpenRouter API.' },
            { status: 500 }
        );
    }
}
