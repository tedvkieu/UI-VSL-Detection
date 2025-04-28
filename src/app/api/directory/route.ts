// src/app/api/directory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        console.log('Received directory request');
        
        const body = await request.json();
        console.log('Request body:', body);
        
        const { rootDir, label } = body;
        
        if (!rootDir || !label) {
            console.error('Missing required fields:', { rootDir, label });
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }
        
        // Create directory if it doesn't exist
        const dirPath = path.join(process.cwd(), rootDir, label);
        console.log('Creating directory:', dirPath);
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log('Directory created:', dirPath);
        } else {
            console.log('Directory already exists:', dirPath);
        }
        
        return NextResponse.json({
            message: `Directory ${dirPath} is ready`,
            dirPath,
        });
    } catch (error) {
        console.error('Error creating directory:', error);
        return NextResponse.json(
            { message: 'Error creating directory', error: String(error) },
            { status: 500 }
        );
    }
}
