import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../env.mjs';

export async function POST(req: NextRequest) {
    try {
        const { input } = await req.json();

        const apiKey = env.GEMINI_API_KEY;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Bạn là một trợ lý chuyên chuyển đổi câu từ ngôn ngữ ký hiệu sang tiếng Việt tự nhiên.
Giữ nguyên nội dung và không dịch sai nghĩa.
Nếu câu có thể viết lại tự nhiên bằng tiếng Việt thì hãy viết lại.
Nếu không đủ thông tin (ví dụ như chỉ gồm các ký tự rời rạc như "A-B-C") thì hãy giữ nguyên.`,
                                },
                                { text: input },
                            ],
                        },
                    ],
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
