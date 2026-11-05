// Sound synthesis & Voice reminder utility for PlanAI

export type VoiceStyle = 'friend' | 'mentor' | 'formal';
export type VoiceMessageType = 'focus' | 'break' | 'congrats' | 'topic_done' | 'ocr_success' | 'sample';

class SoundHelper {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Stop speech synthesis immediately
  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Fallback
      }
    }
  }

  // Play a pleasant chime for timer start/stop/break/actions
  playChime(type: 'start' | 'break' | 'complete' | 'click' = 'complete', enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'break') {
        // Soft meditative tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'complete') {
        // Uplifting major triad
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(739.99, now + 0.18); // F#5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } else {
        // Quick subtle click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        if (typeof window.speechSynthesis.addEventListener === 'function') {
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            window.speechSynthesis.getVoices();
          });
        } else if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
          };
        }
      } catch {
        // Voice listener fallback
      }
    }
  }

  // Promise-based async Thai voice detector to resolve browser voiceschanged delay
  private async getThaiVoice(): Promise<SpeechSynthesisVoice | null> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    let voices = window.speechSynthesis.getVoices();

    // If voices list is empty on page load, wait for voiceschanged event or 500ms max timeout
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        let timer: any;
        const onVoices = () => {
          clearTimeout(timer);
          resolve();
        };

        if (typeof window.speechSynthesis.addEventListener === 'function') {
          window.speechSynthesis.addEventListener('voiceschanged', onVoices, { once: true });
        } else if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = onVoices;
        }

        timer = setTimeout(resolve, 500);
      });
      voices = window.speechSynthesis.getVoices();
    }

    // Expanded search for Thai voice packs across Windows (Pattara), Apple/Siri (Kanya/Narisa), Google, etc.
    const thaiVoice = voices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return (
        l.includes('th') ||
        l.includes('th-th') ||
        l.includes('th_th') ||
        n.includes('thai') ||
        v.name.includes('ไทย') ||
        n.includes('pattara') ||
        n.includes('kanya') ||
        n.includes('narisa')
      );
    });

    return thaiVoice || null;
  }

  // Speak Thai reminder tailored specifically to AI Voice Style (friend | mentor | formal)
  async speakThaiReminder(
    messageType: VoiceMessageType,
    style: VoiceStyle = 'friend',
    enabled: boolean = true,
    customText?: string
  ) {
    if (!enabled) {
      this.stopSpeech();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    let text = customText || '';

    if (!text) {
      if (messageType === 'sample') {
        const samples: Record<VoiceStyle, string[]> = {
          friend: [
            'พร้อมลุยอ่านหนังสือด้วยกันหรือยัง! จะจับเวลาแล้วนะ!',
            'วันนี้มาตั้งใจอ่านหนังสือกันนะเพื่อน!',
            'ยินดีต้อนรับนะ! วันนี้มาเต็มที่อีกวันกัน!',
          ],
          mentor: [
            'สวัสดี เช็คปฏิทินของวันนี้ด้วยนะ',
            'ตั้งใจอ่านหนังสือนะ พี่คอยเป็นกำลังใจให้เสมอ',
            'รอบนี้อ่านทีละหัวข้อ ต้องทำได้แน่นอน',
          ],
          formal: [
            'ยินดีต้อนรับสู่ระบบจัดตารางเวลา แพลนเอไอ ',
            'ขอให้ท่านมีความสุขและประสบความสำเร็จในการทำตามที่วางแผนไว้',
            'ระบบพร้อมช่วยเหลือการจัดตารางเวลาของท่านแล้ว',
          ],
        };
        const list = samples[style] || samples.friend;
        text = list[Math.floor(Math.random() * list.length)];
      } else if (messageType === 'break') {
        if (style === 'friend') {
          text = 'ฮัลโหล! อ่านมาสักพักแล้วนะเพื่อน! ได้เวลาพักสายตา 20 วินาที พักมองออกไปไกลๆ แล้วค่อยกลับมาลุยต่อนะ!';
        } else if (style === 'mentor') {
          text = 'น้องครับ ถึงเวลาพักสายตาแล้วนะครับ หลับตาสักครู่หรือมองต้นไม้สีเขียว สมองจะได้แล่นและไม่ล้าครับ';
        } else {
          text = 'ระบบขอแนะนำให้ท่านพักสายตาตามกฎ 20-20-20 เพื่อรักษาสุขภาพสายตาและสมาธิที่ดีครับ';
        }
      } else if (messageType === 'congrats') {
        if (style === 'friend') {
          text = 'สุดยอดไปเลยเพื่อน! สร้างตารางวิเคราะห์การเรียนสำเร็จแล้ว! ไปลุยทำตามแผนกัน!';
        } else if (style === 'mentor') {
          text = 'เก่งมากครับน้อง! AI ช่วยวางตารางเรียนและวันสอบให้เรียบร้อยแล้วครับ ลุยทีละขั้นตอนได้เลย!';
        } else {
          text = 'ขอแสดงความยินดี ระบบได้สร้างตารางการเรียนและการบ้านอัจฉริยะเสร็จสมบูรณ์แล้วครับ';
        }
      } else if (messageType === 'topic_done') {
        if (style === 'friend') {
          text = 'เยี่ยมมาก! เช็กไปได้อีกหนึ่งหัวข้อแล้ว! เข้าใกล้ความสำเร็จไปอีกขั้นแล้วเพื่อน!';
        } else if (style === 'mentor') {
          text = 'เก่งมากครับน้อง อ่านจบไปอีกหนึ่งบทแล้ว ค่อยๆ ก้าวหน้าอย่างมั่นคงนะครับ';
        } else {
          text = 'ท่านได้ทำการทบทวนหัวข้อนี้เสร็จสมบูรณ์แล้ว ระบบได้บันทึกความคืบหน้าเรียบร้อยครับ';
        }
      } else if (messageType === 'ocr_success') {
        if (style === 'friend') {
          text = 'แจ๋วเลย! อ่านข้อความจากรูปภาพสำเร็จแล้ว! ได้ทั้งวันสอบและวิชาครบเลยนะ!';
        } else if (style === 'mentor') {
          text = 'สกัดข้อมูล OCR จากรูปภาพเรียบร้อยครับน้อง ตรวจสอบวันสอบและหัวข้อได้เลยครับ';
        } else {
          text = 'ระบบประมวลผล OCR จากรูปภาพเสร็จสิ้นแล้ว ได้รับข้อมูลวันที่ วิชา และหัวข้อเรียบร้อยครับ';
        }
      } else {
        // focus
        if (style === 'friend') {
          text = 'มาเริ่มลุยอ่านหนังสือกันเลย! สู้ๆ นะ มีสมาธิเต็มที่นะเพื่อน!';
        } else if (style === 'mentor') {
          text = 'พร้อมแล้วเริ่มกันเลยครับน้อง ค่อยๆ ทำทีละหัวข้อ ไม่ต้องกดดันนะครับ';
        } else {
          text = 'เริ่มต้นช่วงเวลาโฟกัส ขอให้ท่านตั้งใจปฏิบัติงานตามแผนที่วางไว้ครับ';
        }
      }
    }

    try {
      this.stopSpeech();

      // 1. Log all available voices in Developer Tools (F12) before playing speech
      const rawVoices = window.speechSynthesis.getVoices();
      console.log('[PlanAI TTS] raw voices:', rawVoices);
      console.log('[PlanAI TTS] Available voices list:', rawVoices.map((v) => `${v.name} (${v.lang})`));

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enforce Thai Language Code unconditionally
      utterance.lang = 'th-TH';

      // Pitch & Rate configurations for distinct AI personalities
      if (style === 'friend') {
        utterance.pitch = 1.12;
        utterance.rate = 1.05;
      } else if (style === 'mentor') {
        utterance.pitch = 0.90;
        utterance.rate = 0.98;
      } else {
        // formal
        utterance.pitch = 1.00;
        utterance.rate = 0.95;
      }

      // 2. Fetch Thai Voice pack asynchronously to handle browser voiceschanged delay
      const thaiVoice = await this.getThaiVoice();
      if (thaiVoice) {
        utterance.voice = thaiVoice;
        console.log('[PlanAI TTS] Selected Thai voice:', thaiVoice.name, `(${thaiVoice.lang})`);
      } else {
        console.warn('ไม่พบเสียงภาษาไทยในระบบ กำลังใช้เสียง Default');
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[PlanAI TTS] SpeechSynthesis error:', err);
    }
  }
}

export const soundHelper = new SoundHelper();
