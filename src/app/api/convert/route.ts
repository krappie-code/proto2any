import { NextRequest, NextResponse } from "next/server";
import { convert, ConversionFormat } from "@/lib/converters";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let content: string;
    let format: ConversionFormat = 'javascript';

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const formatParam = formData.get("format") as string | null;
      
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      
      content = await file.text();
      if (formatParam && ['javascript', 'json-schema', 'typescript', 'python', 'java', 'go', 'csharp', 'cpp', 'rust', 'c', 'ruby'].includes(formatParam)) {
        format = formatParam as ConversionFormat;
      }
    } else {
      const body = await req.json();
      if (!body.content || typeof body.content !== "string") {
        return NextResponse.json({ error: "Missing 'content' field" }, { status: 400 });
      }
      
      content = body.content;
      if (body.format && ['javascript', 'json-schema', 'typescript', 'python', 'java', 'go', 'csharp', 'cpp', 'rust', 'c', 'ruby'].includes(body.format)) {
        format = body.format as ConversionFormat;
      }
    }

    const result = await convert({ content, format });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Invalid request"
    }, { status: 400 });
  }
}