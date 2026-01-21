import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";
import { encode } from "../utils/audio";

const INPUT_SAMPLE_RATE = 16000;

export class NatureNaniVoiceSession {
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private onTranscript: (text: string, isModel: boolean) => void;
  private onError: (err: any) => void;
  private onTurnComplete: (fullTranscript: string) => void;
  private currentInputTranscript = '';

  constructor(
    callbacks: {
      onTranscript: (text: string, isModel: boolean) => void;
      onTurnComplete: (fullTranscript: string) => void;
      onError: (err: any) => void;
    }
  ) {
    this.onTranscript = callbacks.onTranscript;
    this.onTurnComplete = callbacks.onTurnComplete;
    this.onError = callbacks.onError;
  }

  // Always initialize GoogleGenAI right before making a call to ensure fresh configuration
  async start() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            this.setupMicStream();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text || '';
              this.currentInputTranscript += text;
              this.onTranscript(text, false);
            }
            
            if (message.serverContent?.turnComplete) {
              if (this.currentInputTranscript.trim()) {
                this.onTurnComplete(this.currentInputTranscript);
                this.currentInputTranscript = '';
              }
            }
          },
          onerror: (e) => this.onError(e),
          onclose: () => {},
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Nani. In this mode, you only transcribe user speech accurately. Do not respond with audio yourself yet.",
          inputAudioTranscription: {},
        }
      });
    } catch (e) {
      this.onError(e);
    }
  }

  private setupMicStream() {
    if (!this.micStream || !this.inputAudioContext || !this.sessionPromise) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.micStream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const l = inputData.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = inputData[i] * 32768;
      }
      
      const pcmBase64 = encode(new Uint8Array(int16.buffer));
      // Use the promise chain to avoid race conditions with session initialization
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({
          media: {
            data: pcmBase64,
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  stop() {
    this.sessionPromise?.then(s => s.close());
    this.micStream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
  }
}