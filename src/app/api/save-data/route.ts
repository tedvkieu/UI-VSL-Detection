// src/app/api/save-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { label, data } = await request.json();

        console.log('label:............. ', label);
        console.log('data................', data);
        
        if (!label || !data || !Array.isArray(data)) {
            return NextResponse.json(
                { error: 'Dữ liệu không hợp lệ' },
                { status: 400 }
            );
        }
        
        // Tạo tên file với timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}.csv`;
        
        // Tạo đường dẫn đầy đủ
        const dataDir = path.join(process.cwd(), 'data');
        const labelDir = path.join(dataDir, label);
        const filePath = path.join(labelDir, filename);
        
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        if (!fs.existsSync(labelDir)) {
            fs.mkdirSync(labelDir);
        }
        
        // Tạo header row với các số từ 0-125
        const headerRow = Array.from({ length: 126 }, (_, i) => i.toString()).join(',');
        
        // Chuyển đổi dữ liệu frames thành định dạng CSV
        const csvContent = data.map(frame => frame.join(',')).join('\n');
        
        // Kết hợp header và dữ liệu
        const finalContent = `${headerRow}\n${csvContent}`;
        
        // Ghi file
        fs.writeFileSync(filePath, finalContent);
        
        return NextResponse.json({
            message: `Đã lưu ${data.length} frames vào file ${filename}`,
            filePath: filePath
        });
    } catch (error) {
        console.error('Lỗi khi lưu file CSV:', error);
        return NextResponse.json(
            { error: 'Lỗi khi lưu file CSV' },
            { status: 500 }
        );
    }
}
