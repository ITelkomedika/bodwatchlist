
import { GoogleGenAI, Type } from "@google/genai";
import { TaskPriority, type Task } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
  this.ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  });
}

  async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: mimeType } },
          { text: "Transkripsikan notulensi rapat BOD TelkoMedika ini dengan fokus pada pembagian tugas RACI." }
        ]
      }
    });
    return response.text || "";
  }

  async generateMeetingOpenerSummary(tasks: Task[]): Promise<string> {
    const taskSummary = tasks.map(t => ({
      title: t.title,
      accountable: t.raci.accountable.name,
      status: t.status,
      delay: t.status === 'STAGNANT'
    }));

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Data Mandat: ${JSON.stringify(taskSummary)}. Berikan ringkasan eksekutif 1 paragraf untuk pembukaan rapat Direksi hari ini. Fokus pada akuntabilitas divisi.`
    });
    return response.text || "...";
  }

  async extractTasksWithRACI(notes: string, userList: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Ekstrak daftar penugasan dengan format RACI Matrix dari notulensi rapat BOD TelkoMedika.
      
      ATURAN RACI:
      - Accountable (A): Hanya 1 unit, penanggung jawab utama hasil akhir.
      - Responsible (R): Unit yang melakukan pekerjaan/eksekusi.
      - Consulted (C): Unit yang dimintai saran/data pendukung.
      - Informed (I): Unit yang perlu mengetahui progres.

      REFERENSI UNIT (Gunakan ID):
      ${userList}

      Notulensi: ${notes}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              accountableId: { type: Type.STRING },
              responsibleIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              consultedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              informedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              priority: { type: Type.STRING, enum: Object.values(TaskPriority) },
              meetingDate: { type: Type.STRING },
              dueDate: { type: Type.STRING }
            },
            required: ["title", "description", "accountableId", "responsibleIds", "priority", "dueDate", "meetingDate"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  }
}

export const geminiService = new GeminiService();
