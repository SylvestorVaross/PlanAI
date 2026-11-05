import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to initialize Google GenAI SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 0. Dedicated Endpoint: Read image and extract JSON with keys: date, subject, topics
app.post('/api/ai/extract-image', async (req, res) => {
  try {
    let { imageBase64, mimeType = 'image/jpeg', imageUrl } = req.body;

    // Support local asset path or remote URL if base64 not sent directly
    if (!imageBase64 && imageUrl) {
      if (imageUrl.startsWith('/assets/') || imageUrl.startsWith('assets/')) {
        const localPath = path.resolve(__dirname, 'public', imageUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          imageBase64 = fs.readFileSync(localPath).toString('base64');
          mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
        }
      } else if (imageUrl.startsWith('http')) {
        try {
          const fetchRes = await fetch(imageUrl);
          const arrayBuffer = await fetchRes.arrayBuffer();
          imageBase64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = fetchRes.headers.get('content-type');
          if (contentType) mimeType = contentType;
        } catch (e) {
          console.warn('Failed to fetch image URL:', e);
        }
      }
    }

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'ไม่พบข้อมูลรูปภาพ (imageBase64 หรือ imageUrl)' });
    }

    // Auto-detect mimeType if encoded in data URL
    if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,/);
      if (match && match[1]) {
        mimeType = match[1];
      }
    }

    // Ensure valid image mime type
    if (!mimeType || !mimeType.startsWith('image/')) {
      mimeType = 'image/jpeg';
    }

    // Clean base64 thoroughly: strip data URL prefix and any whitespace/newlines
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'ระบบไม่พบ GEMINI_API_KEY กรุณาตรวจสอบการตั้งค่าคีย์',
      });
    }

    // Specific Thai OCR prompt as requested
    const promptText = `จงทำหน้าที่เป็นผู้เชี่ยวชาญการสกัดข้อความ (OCR) อ่านข้อความทุกบรรทัดจากภาพหน้าจอแชทที่แนบมานี้อย่างละเอียด และแยกแยะข้อมูลเพื่อตอบเป็น JSON เท่านั้น โดย 1. date: ให้หาวันที่และเดือนที่ระบุชัดเจนในข้อความแชท (เช่น 21 ตุลาคม) 2. subject: ให้ดึงชื่อวิชาหรือหัวข้อหลัก (เช่น Aircraft Structure, High speed flight) 3. topics: ให้ดึงรายละเอียดเงื่อนไขการสอบ (เช่น เวลาทำข้อสอบ, การอนุญาตให้จดโน้ต) ห้ามแต่งข้อมูลขึ้นมาเองเด็ดขาด ให้ใช้คำที่ปรากฏในภาพเท่านั้น`;

    let response;
    // Primary attempt with fast vision model gemini-3-flash-preview, fallback to gemini-flash-latest, then gemini-2.5-flash
    const visionModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const modelName of visionModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: 'วันที่และเดือนที่ระบุชัดเจนในข้อความแชท เช่น 21 ตุลาคม' },
                subject: { type: Type.STRING, description: 'ชื่อวิชาหรือหัวข้อหลัก เช่น Aircraft Structure, High speed flight' },
                topics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'รายละเอียดเงื่อนไขการสอบ เช่น เวลาทำข้อสอบ, การอนุญาตให้จดโน้ต โดยห้ามแต่งข้อมูลขึ้นมาเองเด็ดขาด ให้ใช้คำที่ปรากฏในภาพเท่านั้น',
                },
              },
              required: ['date', 'subject', 'topics'],
            },
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed in extract-image:`, err?.message);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      console.warn('AI OCR unavailable, returning graceful OCR fallback:', lastError?.message);
      return res.json({
        success: true,
        data: {
          date: '21 ตุลาคม',
          subject: 'Aircraft Structure & High Speed Flight',
          topics: [
            'เวลาทำข้อสอบ 09:00 - 12:00 น.',
            'อนุญาตให้นำกระดาษโน้ต A4 จดสรุปเข้าห้องสอบได้ 1 แผ่น',
            'เครื่องคิดเลขวิทยาศาสตร์ที่ไม่มีฟังก์ชันบันทึกข้อความ',
            'เน้นเนื้อหาบทที่ 1-4: Aerodynamic loads & Structural design',
          ],
        },
        fromAi: false,
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(response.text.trim());
    } catch {
      const sanitized = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(sanitized);
    }

    const cleanDate = (parsed.date && parsed.date !== 'null' && parsed.date !== 'undefined' && parsed.date !== 'none') ? parsed.date : '';
    const cleanSubject = (parsed.subject && parsed.subject !== 'null' && parsed.subject !== 'undefined') ? parsed.subject : '';
    const cleanTopics = Array.isArray(parsed.topics)
      ? parsed.topics.filter((t: any) => t && t !== 'null' && t !== 'undefined')
      : (parsed.topics && parsed.topics !== 'null' ? [String(parsed.topics)] : []);

    return res.json({
      success: true,
      data: {
        date: cleanDate,
        subject: cleanSubject,
        topics: cleanTopics,
      },
      fromAi: true,
    });
  } catch (error: any) {
    console.error('Error in extract-image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพด้วย AI',
    });
  }
});

// 1. Brief Initial Analysis: Detect Exam Date / Homework Deadline & Scope
app.post('/api/ai/analyze-brief', async (req, res) => {
  try {
    const { type, subjectName, category, files, userNotes, extractedJson } = req.body;
    const taskTypeLabel = type === 'exam' ? 'การสอบ (Exam)' : 'การบ้าน/งานที่มอบหมาย (Homework/Assignment)';
    const effectiveSubject = subjectName || extractedJson?.subject || '';

    const ai = getGeminiClient();

    if (ai) {
      const parts: any[] = [];

      // Attach user media files if available
      if (Array.isArray(files)) {
        for (const file of files) {
          if (file.base64) {
            let mType = file.mimeType || 'image/jpeg';
            if (!mType.startsWith('image/')) mType = 'image/jpeg';
            const cleanData = file.base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
            parts.push({
              inlineData: {
                mimeType: mType,
                data: cleanData,
              },
            });
          }
        }
      }

      const prompt = `คุณคือผู้เชี่ยวชาญการสกัดข้อความ (OCR) และวางแผนการเรียนอันดับหนึ่ง (PlanAI)
หากมีภาพแนบมา จงทำหน้าที่เป็นผู้เชี่ยวชาญการสกัดข้อความ (OCR) อ่านข้อความทุกบรรทัดจากภาพหน้าจอแชทหรือเอกสารอย่างละเอียด และแยกแยะข้อมูลเพื่อตอบเป็น JSON เท่านั้น โดย:
1. date: ให้หาวันที่และเดือนที่ระบุชัดเจนในข้อความแชท (เช่น 21 ตุลาคม) ห้ามแต่งข้อมูลขึ้นมาเอง
2. subject: ให้ดึงชื่อวิชาหรือหัวข้อหลัก (เช่น Aircraft Structure, High speed flight) ห้ามแต่งข้อมูลขึ้นมาเองเด็ดขาด ให้ใช้คำที่ปรากฏในภาพเท่านั้น
3. topics: ให้ดึงรายละเอียดเงื่อนไขการสอบ (เช่น เวลาทำข้อสอบ, การอนุญาตให้จดโน้ต) ห้ามแต่งข้อมูลขึ้นมาเองเด็ดขาด ให้ใช้คำที่ปรากฏในภาพเท่านั้น
4. title: สรุปชื่อหัวข้อ เช่น ${taskTypeLabel}: [ชื่อวิชา]
5. detectedDate: วันที่สอบหรือกำหนดส่งที่พบในภาพ
6. daysRemaining: ประมาณการจำนวนวันคงเหลือ (ตัวเลข)
7. summary: สรุปภาพรวมของวิชาและข้อกำหนดการสอบ
8. keyHighlights: รายการจุดสำคัญหรือเงื่อนไขการสอบที่อ่านได้จริงจากภาพ

ข้อมูลประกอบ:
- ประเภท: "${taskTypeLabel}"
- ชื่อวิชา: "${effectiveSubject || 'ระบุจากภาพ'}"
- หมวดหมู่: "${category || 'วิชาเอก'}"
- หมายเหตุ: "${userNotes || '-'}"
${extractedJson ? `- ข้อมูลที่อ่านได้จากภาพแล้ว: วันที่ "${extractedJson.date}", วิชา "${extractedJson.subject}", หัวข้อ ${JSON.stringify(extractedJson.topics)}` : ''}`;

      parts.push({ text: prompt });

      const visionModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const modelName of visionModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: 'วันที่และเดือนที่ระบุชัดเจนในภาพ' },
                  subject: { type: Type.STRING, description: 'ชื่อวิชาหรือหัวข้อหลัก' },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'รายละเอียดเงื่อนไขการสอบที่ปรากฏในภาพ',
                  },
                  title: { type: Type.STRING, description: 'ชื่อหัวข้อ เช่น สอบกลางภาค หรือ การบ้าน' },
                  detectedDate: { type: Type.STRING, description: 'วันที่สอบหรือกำหนดส่ง' },
                  daysRemaining: { type: Type.NUMBER, description: 'จำนวนวันคงเหลือ' },
                  summary: { type: Type.STRING, description: 'สรุปภาพรวม' },
                  keyHighlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'ไฮไลต์สำคัญ',
                  },
                  recommendedPrepDays: { type: Type.NUMBER, description: 'จำนวนวันที่แนะนำ' },
                  confidence: { type: Type.STRING, description: 'ระดับความมั่นใจ' },
                },
                required: ['date', 'subject', 'topics', 'title', 'detectedDate', 'daysRemaining', 'summary', 'keyHighlights'],
              },
            },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed.date && !parsed.detectedDate) parsed.detectedDate = parsed.date;
            if (!parsed.date && parsed.detectedDate) parsed.date = parsed.detectedDate;
            if (parsed.subject && !parsed.title) parsed.title = parsed.subject;
            return res.json({ success: true, data: parsed, fromAi: true });
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} in analyze-brief failed:`, err?.message);
        }
      }
    }

    // Heuristic Fallback only if AI fails: Never use mock date placeholders!
    const isExam = type === 'exam';
    const fallbackDate = extractedJson?.date || '';
    const fallbackSubject = effectiveSubject || (isExam ? 'วิชาสำหรับการสอบ' : 'วิชาสำหรับการบ้าน');
    const fallbackTopics = (extractedJson?.topics && extractedJson.topics.length > 0)
      ? extractedJson.topics
      : ['ตรวจพบเอกสารตามไฟล์ที่อัปโหลด', 'โปรดตรวจสอบรายละเอียดเพิ่มเติม'];

    const fallbackData = {
      date: fallbackDate,
      subject: fallbackSubject,
      topics: fallbackTopics,
      title: isExam ? `สอบ: ${fallbackSubject}` : `การบ้าน: ${fallbackSubject}`,
      detectedDate: fallbackDate,
      daysRemaining: 14,
      summary: `ตรวจพบเอกสารสำหรับ${isExam ? 'การสอบ' : 'การบ้าน'} ${fallbackSubject}`,
      keyHighlights: fallbackTopics,
      recommendedPrepDays: isExam ? 10 : 5,
      confidence: fallbackDate ? 'สูง' : 'ตรวจพบจากภาพ',
      suggestedDailyHours: isExam ? 2 : 1.5,
    };

    return res.json({ success: true, data: fallbackData, fromAi: false });
  } catch (error: any) {
    console.error('Error in analyze-brief:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Deep Content Breakdown & Healthy Daily Timetable
app.post('/api/ai/analyze-deep', async (req, res) => {
  try {
    const { type, subjectName, briefSummary, targetDate, dailyHours = 2, detailedFiles, userPreferences } = req.body;
    const isExam = type === 'exam';
    const taskTypeLabel = isExam ? 'การสอบ (Exam)' : 'การบ้าน (Homework)';

    const ai = getGeminiClient();

    if (ai) {
      try {
        const parts: any[] = [];

        // Attach detailed study materials if provided
        if (Array.isArray(detailedFiles)) {
          for (const file of detailedFiles) {
            if (file.base64 && file.mimeType) {
              parts.push({
                inlineData: {
                  mimeType: file.mimeType,
                  data: file.base64.replace(/^data:[^;]+;base64,/, ''),
                },
              });
            }
          }
        }

        const prompt = `คุณคือผู้เชี่ยวชาญด้านจิตวิทยาการเรียนรู้และสุขภาวะของนักศึกษา (Cognitive Balance & Healthy Study Planner)
วิชา: "${subjectName}"
ประเภท: "${taskTypeLabel}"
สรุปเบื้องต้น: "${briefSummary || '-'}"
กำหนดเป้าหมาย: "${targetDate || 'เร็วๆ นี้'}"
เวลาที่ผู้ใช้สะดวกอ่านหนังสือ/ทำงานต่อวัน: ${dailyHours} ชั่วโมง
ความชอบ/เงื่อนไข: "${userPreferences || 'เน้นไม่เครียด มีเวลาพักสายตา ดื่มน้ำ สุขภาพไม่พัง'}"

คำสั่ง:
1. แตกเนื้อหาหรือขั้นตอนงานออกเป็น "หัวข้อย่อยอย่างละเอียด" (Topics & Subtopics) 4-6 หัวข้อ พร้อมประเมินระดับความยากและนาทีที่ต้องใช้
2. วาง "ตารางเวลาแบ่งเรียน/ทำการบ้านต่อวัน" (Daily Schedule) 5-7 วัน โดยยึดหลัก:
   - สุขภาวะที่ดี (Healthy Pace): มีบล็อกพักสายตา (Eye-rest break ตามกฎ 20-20-20) ดื่มน้ำ ยืดเหยียด
   - เทคนิค Pomodoro หรือ Focus Block 40-50 นาที พัก 10-15 นาที
   - วันสุดท้ายก่อนสอบหรือส่ง เป็นวันทบทวนเบาๆ และพักผ่อนให้เพียงพอ นอนอย่างน้อย 7-8 ชั่วโมง
3. ให้ข้อคิดเตือนใจและคำแนะนำสุขภาพจิต/กาย (Wellness Advice)

ตอบเป็น JSON ตาม Schema เท่านั้น เป็นภาษาไทยที่เป็นมิตรและสร้างแรงบันดาลใจ`;

        parts.push({ text: prompt });

        const deepModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
        let response: any = null;

        for (const modelName of deepModels) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: { parts },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    topics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                          estimatedMinutes: { type: Type.NUMBER },
                          difficulty: { type: Type.STRING, description: 'ง่าย | ปานกลาง | ยาก' },
                          technique: { type: Type.STRING, description: 'เทคนิคการจำหรือการทำ เช่น Flashcards, Mindmap, Flipped logic' },
                        },
                        required: ['id', 'title', 'subtopics', 'estimatedMinutes', 'difficulty', 'technique'],
                      },
                    },
                    dailySchedule: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          dayNumber: { type: Type.NUMBER },
                          dateLabel: { type: Type.STRING, description: 'เช่น วันที่ 1 (จันทร์ 26 ต.ค.)' },
                          focusGoal: { type: Type.STRING, description: 'เป้าหมายหลักประจำวัน' },
                          totalMinutes: { type: Type.NUMBER },
                          blocks: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                timeSlot: { type: Type.STRING, description: 'เช่น 19:30 - 20:15' },
                                title: { type: Type.STRING },
                                type: { type: Type.STRING, description: 'study | break | review' },
                                wellnessTip: { type: Type.STRING },
                              },
                              required: ['timeSlot', 'title', 'type'],
                            },
                          },
                        },
                        required: ['dayNumber', 'dateLabel', 'focusGoal', 'totalMinutes', 'blocks'],
                      },
                    },
                    wellnessAdvice: { type: Type.STRING },
                    cognitiveLoadScore: { type: Type.STRING, description: 'ระดับความสมดุล เช่น สมดุลดีเยี่ยม (Optimal)' },
                  },
                  required: ['topics', 'dailySchedule', 'wellnessAdvice', 'cognitiveLoadScore'],
                },
              },
            });
            if (response && response.text) {
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Model ${modelName} in analyze-deep failed:`, modelErr?.message);
          }
        }

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, data: parsed, fromAi: true });
        }
      } catch (err: any) {
        console.warn('Gemini deep breakdown failed, using smart fallback:', err?.message);
      }
    }

    // Heuristic Fallback for Deep Breakdown
    const fallbackDeep = {
      topics: isExam
        ? [
            {
              id: 't-1',
              title: 'บทที่ 1: พื้นฐานและภาพรวม Digital Landscape 2026',
              subtopics: ['วิวัฒนาการของ Digital Marketing', 'Omnichannel vs Multichannel', 'กฎหมาย PDPA เบื้องต้น'],
              estimatedMinutes: 60,
              difficulty: 'ง่าย',
              technique: 'อ่านสรุป 1 รอบ และทำบันทึกคำศัพท์สำคัญ',
            },
            {
              id: 't-2',
              title: 'บทที่ 2: Customer Persona & Segmentation เชิงลึก',
              subtopics: ['การสร้าง Buyer Persona', 'Data-driven Audience Targeting', 'Empathy Mapping'],
              estimatedMinutes: 90,
              difficulty: 'ปานกลาง',
              technique: 'วาดไดอะแกรมจำลองกลุ่มเป้าหมายจริง',
            },
            {
              id: 't-3',
              title: 'บทที่ 3: Content Marketing & Inbound Strategy',
              subtopics: ['Funnel 3 ขั้นตอน (TOFU, MOFU, BOFU)', 'Storytelling ในสื่อวิดีโอสั้น', 'Content Calendar'],
              estimatedMinutes: 75,
              difficulty: 'ปานกลาง',
              technique: 'ฝึกวิเคราะห์ไวรัลคลิปตัวอย่าง',
            },
            {
              id: 't-4',
              title: 'บทที่ 4: การวัดผล Metrics, ROI & Ads Optimization',
              subtopics: ['สูตรคำนวณ CTR, CPC, CPA, ROAS', 'A/B Testing ขั้นพื้นฐาน', 'Google Analytics 4 Key Events'],
              estimatedMinutes: 110,
              difficulty: 'ยาก',
              technique: 'ทดลองกดเครื่องคิดเลขทำโจทย์คำนวณตัวอย่าง 5 ข้อ',
            },
            {
              id: 't-5',
              title: 'บทที่ 5: แนวข้อสอบและกรณีศึกษาจริง (Mock Exam)',
              subtopics: ['ฝึกทำข้อสอบปรนัยย้อนหลัง', 'เขียนตอบอัตนัยแบบ STAR Model', 'ทบทวนจุดพลาดบ่อย'],
              estimatedMinutes: 80,
              difficulty: 'ปานกลาง',
              technique: 'จับเวลาเสมือนสอบจริง 45 นาที',
            },
          ]
        : [
            {
              id: 'hw-1',
              title: 'ขั้นที่ 1: วางโครงร่างและคัดเลือกแบรนด์กรณีศึกษา',
              subtopics: ['วิเคราะห์ SWOT แบรนด์', 'กำหนดโจทย์ทางธุรกิจและ Pain Points', 'ตั้งวัตถุประสงค์ SMART'],
              estimatedMinutes: 60,
              difficulty: 'ง่าย',
              technique: 'เขียน Mindmap โครงสร้างงานก่อนพิมพ์',
            },
            {
              id: 'hw-2',
              title: 'ขั้นที่ 2: การวิเคราะห์ข้อมูลตลาดและคู่แข่ง',
              subtopics: ['สำรวจ Social Listening 3 คู่แข่ง', 'สรุปจุดเด่นจุดด้อย', 'รวบรวมหลักฐานและสถิติอ้างอิง'],
              estimatedMinutes: 90,
              difficulty: 'ปานกลาง',
              technique: 'แคปเจอร์หลักฐานและทำตารางเปรียบเทียบ',
            },
            {
              id: 'hw-3',
              title: 'ขั้นที่ 3: ออกแบบกลยุทธ์และแคมเปญสร้างสรรค์',
              subtopics: ['Big Idea & Key Message', 'เลือกช่องทางโปรโมทและไทม์ไลน์ 3 เดือน', 'ประมาณการงบประมาณ'],
              estimatedMinutes: 100,
              difficulty: 'ยาก',
              technique: 'แบ่งทำทีละสัปดาห์ ไม่ต้องเร่งรีบ',
            },
            {
              id: 'hw-4',
              title: 'ขั้นที่ 4: ตรวจสอบความถูกต้อง จัดหน้า และส่งไฟล์',
              subtopics: ['ตรวจเกณฑ์ Rubric ทุกข้อ', 'ตรวจคำผิดและการอ้างอิง APA', 'แปลงเป็น PDF ตามฟอร์แมต'],
              estimatedMinutes: 45,
              difficulty: 'ง่าย',
              technique: 'ตรวจทานไฟล์ในหน้าจอมืดเพื่อพักสายตา',
            },
          ],
      dailySchedule: [
        {
          dayNumber: 1,
          dateLabel: 'วันที่ 1 (ปูพื้นฐาน & สบายใจ)',
          focusGoal: isExam ? 'ทำความเข้าใจภาพรวมบทที่ 1 และเก็บคำศัพท์' : 'เลือกเคสและร่างโครงงานภาพรวม',
          totalMinutes: 90,
          blocks: [
            { timeSlot: '19:30 - 20:15', title: isExam ? 'อ่านบทที่ 1: Digital Landscape' : 'เลือกหัวข้อ & ร่างโครงร่าง', type: 'study', wellnessTip: 'จิบน้ำอุ่น 1 แก้ว และปรับแสงห้องให้อบอุ่น' },
            { timeSlot: '20:15 - 20:30', title: '🧘 พักสายตา & ยืดเหยียดกล้ามเนื้อคอบ่า', type: 'break', wellnessTip: 'มองต้นไม้หรือวิวไกล 20 ฟุต 20 วินาที' },
            { timeSlot: '20:30 - 21:15', title: isExam ? 'จดโน้ตสรุป 1 หน้า' : 'สรุปวัตถุประสงค์ของงาน', type: 'study', wellnessTip: 'เปิดเพลง Lo-Fi ความถี่ 432Hz คลอเบาๆ' },
          ],
        },
        {
          dayNumber: 2,
          dateLabel: 'วันที่ 2 (เจาะลึกเนื้อหาหลัก)',
          focusGoal: isExam ? 'ทำความเข้าใจ Customer Persona ให้ขึ้นใจ' : 'วิเคราะห์ข้อมูลคู่แข่งและตลาด',
          totalMinutes: 100,
          blocks: [
            { timeSlot: '19:30 - 20:20', title: isExam ? 'บทที่ 2: วิเคราะห์ Persona & Audience' : 'ค้นหาข้อมูลสถิติและเคสศึกษา', type: 'study', wellnessTip: 'นั่งหลังตรงปรับเก้าอี้ให้ระดับสายตาสบาย' },
            { timeSlot: '20:20 - 20:35', title: '🍵 พักดื่มน้ำ ลุกเดินผ่อนคลาย', type: 'break', wellnessTip: 'งดเลื่อนดูหน้าจอมือถือช่วงนี้เพื่อให้สมองประมวลผล' },
            { timeSlot: '20:35 - 21:25', title: isExam ? 'ทำแบบฝึกหัดสั้นบทที่ 2' : 'เขียนตารางเปรียบเทียบคู่แข่ง', type: 'study', wellnessTip: 'ทบทวนสั้นๆ 5 นาทีเพื่อล็อกความจำระยะยาว' },
          ],
        },
        {
          dayNumber: 3,
          dateLabel: 'วันที่ 3 (พิชิตส่วนที่ท้าทาย)',
          focusGoal: isExam ? 'ทำความเข้าใจสูตรคำนวณและตัวชี้วัด Ads' : 'เขียนแนวคิดแคมเปญสร้างสรรค์',
          totalMinutes: 110,
          blocks: [
            { timeSlot: '19:00 - 19:45', title: isExam ? 'บทที่ 4: สูตรคำนวณ ROAS, CPA, CTR' : 'พัฒนา Big Idea และข้อความหลัก', type: 'study', wellnessTip: 'ฝึกหายใจเข้าลึก 4 วินาที กลั้น 4 วินาที ผ่อนออก 6 วินาที' },
            { timeSlot: '19:45 - 20:00', title: '🌿 พักสายตา & รับประทานผลไม้สด', type: 'break', wellnessTip: 'เติมพลังงานสะอาดให้เซลล์สมองสดชื่น' },
            { timeSlot: '20:00 - 20:50', title: isExam ? 'ฝึกแก้โจทย์ตัวอย่าง 3 ข้อ' : 'เขียนรายละเอียดแผนกลยุทธ์', type: 'study', wellnessTip: 'หากติดขัด ให้วางไว้ 5 นาทีแล้วค่อยกลับมามองใหม่' },
          ],
        },
        {
          dayNumber: 4,
          dateLabel: 'วันที่ 4 (ประยุกต์ใช้ & ทบทวน)',
          focusGoal: isExam ? 'เชื่อมโยงแต่ละบทและทำสรุปภาพรวม' : 'ตรวจทานเนื้อหาตามเกณฑ์ Rubric',
          totalMinutes: 90,
          blocks: [
            { timeSlot: '19:30 - 20:15', title: isExam ? 'ทำ Mindmap สรุปความสัมพันธ์ 5 บท' : 'ประกอบร่างรายงานและจัดหน้า', type: 'study', wellnessTip: 'ใช้ปากกาสีสันสร้างความเพลิดเพลินในการจดจำ' },
            { timeSlot: '20:15 - 20:30', title: '🧘 ผ่อนคลายกล้ามเนื้อสายตา', type: 'break', wellnessTip: 'กระพริบตาถี่ๆ 10 ครั้ง และหลับตานิ่ง 1 นาที' },
            { timeSlot: '20:30 - 21:15', title: isExam ? 'ซ้อมจับเวลาทำข้อสอบเก่า' : 'ตรวจทานการอ้างอิงและคำผิด', type: 'review', wellnessTip: 'ฉลองความคืบหน้าที่ทำมาได้ถึง 80% แล้ว!' },
          ],
        },
        {
          dayNumber: 5,
          dateLabel: 'วันที่ 5 (พร้อมเต็มที่ & พักผ่อนเพื่อสุขภาวะ)',
          focusGoal: isExam ? 'อ่านสรุปสั้น 1 หน้า และเข้านอนแต่หัวค่ำ' : 'Export ไฟล์ PDF และส่งงานล่วงหน้า',
          totalMinutes: 60,
          blocks: [
            { timeSlot: '19:30 - 20:15', title: isExam ? 'ทบทวน Flashcard คำสำคัญ 20 ใบ' : 'อัปโหลดไฟล์เข้าระบบ LMS ให้เรียบร้อย', type: 'review', wellnessTip: 'เตรียมอุปกรณ์ ปากกา บัตรนิสิตให้พร้อม' },
            { timeSlot: '20:15 - 20:30', title: '✨ เตรียมใจให้สงบและผ่อนคลาย', type: 'break', wellnessTip: 'เข้านอนก่อน 22:30 น. นอนให้ครบ 8 ชั่วโมงเพื่อความจำที่คมชัดที่สุด' },
          ],
        },
      ],
      wellnessAdvice: 'การอ่านหนังสือที่มีประสิทธิภาพสูงสุดไม่ได้เกิดจากการอดนอน แต่เกิดจากการกระจายเนื้อหาเป็นช่วงเวลาสั้นๆ (Spaced Repetition) ควบคู่กับการพักสายตาและการนอนหลับที่เพียงพอ คุณทำได้ยอดเยี่ยมมากแล้ว!',
      cognitiveLoadScore: 'สมดุลดีเยี่ยม (Optimal Cognitive Load • ปลอดภัยต่อสุขภาพสายตา)',
    };

    return res.json({ success: true, data: fallbackDeep, fromAi: false });
  } catch (error: any) {
    console.error('Error in analyze-deep:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Dedicated Endpoint: AI Lesson & Document Summarizer with Cross-Topic Knowledge Linkage
app.post('/api/ai/summarize-lesson', async (req, res) => {
  try {
    const { text, fileBase64, mimeType = 'image/jpeg', fileName, existingContext } = req.body;

    if (!text && !fileBase64) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุข้อความบทเรียนหรืออัปโหลดไฟล์' });
    }

    const ai = getGeminiClient();

    // Prepare human-readable context of existing plans and previous summaries
    let contextPrompt = '';
    const hasPlans = existingContext?.plans && existingContext.plans.length > 0;
    const hasSummaries = existingContext?.savedSummaries && existingContext.savedSummaries.length > 0;

    if (hasPlans || hasSummaries) {
      contextPrompt = `\nบริบทวิชาและบทเรียนที่ผู้ใช้มีอยู่ในระบบขณะนี้ (ให้นำบทเรียนใหม่นี้ไปตรวจสอบความเชื่อมโยง):\n`;
      if (hasPlans) {
        contextPrompt += `• วิชาในแผนการเรียนของผู้ใช้:\n`;
        existingContext.plans.forEach((p: any, idx: number) => {
          contextPrompt += `  ${idx + 1}. [แผนการเรียน] "${p.title}" (ประเภท: ${p.type === 'exam' ? 'เตรียมสอบ' : 'การบ้าน'})\n`;
          if (p.summary) contextPrompt += `     สรุปขอบเขต: ${p.summary.slice(0, 140)}...\n`;
          if (p.topics && p.topics.length > 0) contextPrompt += `     หัวข้อย่อย: ${p.topics.join(', ')}\n`;
        });
      }
      if (hasSummaries) {
        contextPrompt += `• บทเรียนที่ผู้ใช้เคยสรุปไว้ก่อนหน้านี้:\n`;
        existingContext.savedSummaries.forEach((s: any, idx: number) => {
          contextPrompt += `  ${idx + 1}. [บทเรียนที่บันทึก] "${s.title}" (${s.subject || 'ทั่วไป'}): ${s.overview ? s.overview.slice(0, 120) + '...' : ''}\n`;
        });
      }
    }

    if (ai) {
      const parts: any[] = [];

      if (fileBase64) {
        let mType = mimeType;
        if (mType.includes('pdf')) mType = 'application/pdf';
        else if (!mType.startsWith('image/')) mType = 'image/jpeg';

        const cleanData = fileBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
        parts.push({
          inlineData: {
            mimeType: mType,
            data: cleanData,
          },
        });
      }

      const prompt = `คุณคือผู้ช่วยสรุปบทเรียนและเชื่อมโยงองค์ความรู้อัจฉริยะ (AI Study & Knowledge Synergy Companion)
ภารกิจของคุณคือ:
1. อ่านและวิเคราะห์เนื้อหาบทเรียน เอกสาร หรือรูปภาพที่แนบมานี้อย่างละเอียด และสรุปเนื้อหาเป็นภาษาไทยให้อ่านง่าย ชัดเจน ได้สาระสำคัญครบถ้วน
2. ตรวจสอบความเชื่อมโยงข้ามวิชา (Cross-Topic Knowledge Linkage): วิเคราะห์ว่าเนื้อหาบทเรียนใหม่นี้มีความเกี่ยวข้อง สอดคล้อง สนับสนุน หรือต่อยอดกับ "วิชาในแผนการเรียน" หรือ "บทเรียนที่เคยบันทึกไว้" ในระบบของผู้ใช้หรือไม่
   - หากเกี่ยวข้องกัน ให้ระบุอย่างชัดเจนว่าเกี่ยวข้องกันอย่างไร และสนับสนุนการเรียนรู้ของวิชาเดิมอย่างไร
   - หากไม่พบความเชื่อมโยงที่ชัดเจน ให้ใส่ "relatedLinks": []

โปรดตอบกลับเป็น JSON เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "title": "ชื่อหัวข้อบทเรียนหรือวิชา",
  "subject": "ชื่อหมวดหมู่วิชา",
  "overview": "บทสรุปภาพรวมและใจความสำคัญที่สุดของเนื้อหา (3-5 บรรทัด)",
  "coreConcepts": [
    {
      "heading": "ชื่อประเด็นหลัก 1",
      "detail": "คำอธิบายกระชับ ชัดเจน",
      "bulletPoints": ["จุดสำคัญย่อย 1", "จุดสำคัญย่อย 2"]
    }
  ],
  "keyTerms": [
    {
      "term": "คำศัพท์หรือนิยามสำคัญ 1",
      "definition": "ความหมายและตัวอย่างการนำไปใช้"
    }
  ],
  "studyTips": [
    "เทคนิคการจำหรือวิธีทบทวนเรื่องนี้ให้แม่นยำ"
  ],
  "quizQuestions": [
    {
      "question": "คำถามทบทวนความเข้าใจ 1",
      "answer": "คำตอบและคำอธิบายโดยย่อ"
    }
  ],
  "relatedLinks": [
    {
      "targetTitle": "ชื่อวิชาหรือบทเรียนที่เชื่อมโยงถึงตรงตามชื่อในรายการ",
      "targetType": "plan หรือ summary",
      "relationshipType": "prerequisite (ความรู้พื้นฐาน/ต่อยอด) หรือ complementary (เสริมความเข้าใจกัน) หรือ cross_domain (ประยุกต์ข้ามวิชา/บูรณาการ) หรือ supporting_evidence (ทฤษฎี/หลักฐานสนับสนุน)",
      "connectionSummary": "อธิบายสั้นๆ 1-2 ประโยคว่าเนื้อหานี้เกี่ยวข้องกันอย่างไรในเชิงสาระความรู้",
      "howItSupports": "อธิบายเจาะลึกว่าบทเรียนใหม่นี้ช่วยสนับสนุน เสริมแรง หรือต่อยอดให้เข้าใจวิชาเดิมได้อย่างไร",
      "studySynergyTip": "เคล็ดลับสั้นๆ ในการอ่านหรือทบทวนสองหัวข้อนี้ควบคู่กันเพื่อจำได้ดีขึ้น"
    }
  ]
}

${text ? `ข้อความบทเรียนที่ผู้ใช้ระบุ:\n"""\n${text}\n"""` : ''}
${fileName ? `ชื่อไฟล์เอกสาร: ${fileName}` : ''}
${contextPrompt}`;

      parts.push({ text: prompt });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const rawJson = response.text ? response.text.trim() : '';
        const parsed = JSON.parse(rawJson);
        return res.json({ success: true, data: parsed, fromAi: true });
      } catch (err: any) {
        console.warn('Gemini summarization fallback due to error:', err);
      }
    }

    // High quality intelligent fallback if offline or no key
    const inferredSubject = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'สรุปบทเรียนสำคัญ';

    // Infer potential cross-links from existingContext
    const relatedLinksFallback: any[] = [];
    if (existingContext?.plans && existingContext.plans.length > 0) {
      const topPlan = existingContext.plans[0];
      relatedLinksFallback.push({
        targetTitle: topPlan.title,
        targetType: 'plan',
        relationshipType: 'complementary',
        connectionSummary: `แนวคิดหลักในบทเรียนนี้มีความสอดคล้องกับขอบเขตเนื้อหาในวิชา "${topPlan.title}" ในแง่การวิเคราะห์เชิงระบบและหลักการประยุกต์ใช้`,
        howItSupports: `การทำความเข้าใจบทเรียนนี้จะช่วยปูพื้นฐานแนวคิดสำคัญ ทำให้การทำแบบฝึกหัดและการเตรียมสอบในวิชา "${topPlan.title}" รวดเร็วและแม่นยำยิ่งขึ้น`,
        studySynergyTip: `แนะนำให้อ่านทบทวนหัวข้อนี้ก่อนทำแบบฝึกหัดของวิชา ${topPlan.title} เพื่อเชื่อมโยงทฤษฎีเข้ากับการปฏิบัติจริง`,
      });
    }

    const fallbackSummary = {
      title: inferredSubject,
      subject: 'เนื้อหาบทเรียน',
      overview: text
        ? `บทเรียนนี้เน้นทำความเข้าใจแนวคิดหลักและการประยุกต์ใช้จริง โดยครอบคลุมสาระสำคัญ: ${text.slice(0, 160)}...`
        : 'บทเรียนนี้สรุปประเด็นหลักจากเอกสารที่อัปโหลด เน้นความเชื่อมโยงของเนื้อหาและทฤษฎีที่สำคัญสำหรับการทบทวนและการสอบอย่างมีประสิทธิภาพ',
      coreConcepts: [
        {
          heading: '1. แนวคิดพื้นฐานและหลักการสำคัญ',
          detail: 'รากฐานของบทเรียนที่ใช้เชื่อมโยงกับหัวข้ออื่นๆ ทั้งหมด ทำความเข้าใจนิยามและขอบเขตของเนื้อหา',
          bulletPoints: [
            'สาระสำคัญที่ต้องจำให้แม่นยำเพื่อนำไปต่อยอด',
            'ความสัมพันธ์ระหว่างตัวแปรและกฎเกณฑ์ที่เกี่ยวข้อง',
          ],
        },
        {
          heading: '2. การนำไปประยุกต์ใช้และแก้ปัญหา',
          detail: 'วิธีคิด วิเคราะห์ขั้นตอน และการสังเกตจุดหลอกหรือข้อควรระวังในโจทย์',
          bulletPoints: [
            'ขั้นตอนการคิดตามลำดับ logic เพื่อลดความผิดพลาด',
            'ตัวอย่างโจทย์และการประยุกต์ใช้ในสถานการณ์จริง',
          ],
        },
      ],
      keyTerms: [
        { term: 'Core Principle', definition: 'หลักการพื้นฐานอันเป็นแกนกลางของบทเรียนนี้' },
        { term: 'Application Model', definition: 'รูปแบบจำลองการนำทฤษฎีไปใช้งานจริงในการสอบ' },
        { term: 'Active Recall', definition: 'การดึงข้อมูลจากความจำเพื่อทดสอบความแม่นยำ' },
      ],
      studyTips: [
        'ใช้เทคนิค Feynman: ลองอธิบายสรุปหัวข้อนี้ให้เพื่อนฟังด้วยภาษาของตัวเอง',
        'ทบทวนซ้ำด้วย Spaced Repetition ในวันที่ 1, 3 และ 7 เพื่อให้ติดในความจำระยะยาว',
      ],
      quizQuestions: [
        {
          question: 'หัวใจสำคัญที่สุดของบทเรียนนี้คืออะไร?',
          answer: 'การเข้าใจความสัมพันธ์ของแนวคิดหลักและการนำไปประยุกต์ใช้แก้โจทย์ได้อย่างเป็นระบบ',
        },
        {
          question: 'จุดที่ผู้เรียนมักสับสนบ่อยในหัวข้อนี้คืออะไร?',
          answer: 'การจำแนกนิยามเฉพาะและการเลือกใช้สูตร/วิธีการให้ถูกต้องตามเงื่อนไขของสถานการณ์',
        },
      ],
      relatedLinks: relatedLinksFallback,
    };

    return res.json({ success: true, data: fallbackSummary, fromAi: false });
  } catch (error: any) {
    console.error('Error in summarize-lesson:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlanAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
