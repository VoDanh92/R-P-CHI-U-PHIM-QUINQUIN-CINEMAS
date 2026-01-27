
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export class GeminiService {
  private static getAI() {
    // Guidelines: Always initialize GoogleGenAI with a fresh instance to ensure correct API key usage
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static readonly tools: { functionDeclarations: FunctionDeclaration[] }[] = [
    {
      functionDeclarations: [
        {
          name: 'check_ticket_status',
          description: 'Kiểm tra thông tin vé đã đặt bằng số điện thoại.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              phoneNumber: {
                type: Type.STRING,
                description: 'Số điện thoại của khách hàng đã dùng để đặt vé.'
              }
            },
            required: ['phoneNumber']
          }
        },
        {
          name: 'cancel_ticket',
          description: 'Hủy vé đã đặt yêu cầu mã vé và số điện thoại.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              ticketId: {
                type: Type.STRING,
                description: 'Mã vé (ID vé) cần hủy.'
              },
              phoneNumber: {
                type: Type.STRING,
                description: 'Số điện thoại của khách hàng.'
              }
            },
            required: ['ticketId', 'phoneNumber']
          }
        },
        {
          name: 'book_movie',
          description: 'Bắt đầu quy trình đặt vé cho một bộ phim cụ thể.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              movieTitle: {
                type: Type.STRING,
                description: 'Tên bộ phim khách hàng muốn đặt vé.'
              }
            },
            required: ['movieTitle']
          }
        }
      ]
    }
  ];

  static async chat(message: string) {
    const ai = this.getAI();
    // Use simpler contents string format as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction: `Bạn là trợ lý thông minh của hệ thống rạp QUINQUIN CINEMAS.
        Nhiệm vụ:
        1. Giúp người dùng kiểm tra vé tại QuinQuin: gọi function check_ticket_status.
        2. Giúp người dùng hủy vé: gọi function cancel_ticket.
        3. Giúp người dùng đặt vé phim tại rạp: gọi function book_movie khi họ nhắc đến phim muốn xem.
        
        Phong cách: Thân thiện, lịch sự, sử dụng icon rạp phim 🎬🍿. Tự giới thiệu là "QuinQuin Cinemas AI".`,
        tools: this.tools
      }
    });

    return response;
  }

  static async generateMoviePoster(prompt: string, size: '1K' | '2K' | '4K' = '1K', aspectRatio: '3:4' | '16:9' | '1:1' = '3:4') {
    const ai = this.getAI();
    // Image Generation: gemini-3-pro-image-preview supports specified imageSize and aspectRatio
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A high-quality cinematic movie poster for: ${prompt}. Professional lighting, 8k resolution, artistic design.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: size as any,
        }
      }
    });

    // Guidelines: Iterate through candidates and parts to safely extract image data
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error('Failed to generate image');
  }
}
