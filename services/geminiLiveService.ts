
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";

// Audio constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class NatureNaniVoiceSession {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private onTranscript: (text: string, isModel: boolean) => void;
  private onError: (err: any) => void;
  private onStateChange: (state: 'idle' | 'listening' | 'speaking') => void;

  constructor(
    callbacks: {
      onTranscript: (text: string, isModel: boolean) => void;
      onError: (err: any) => void;
      onStateChange: (state: 'idle' | 'listening' | 'speaking') => void;
    }
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onTranscript = callbacks.onTranscript;
    this.onError = callbacks.onError;
    this.onStateChange = callbacks.onStateChange;
  }

  async start() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            this.onStateChange('idle');
            this.setupMicStream();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              this.onTranscript(message.serverContent.outputTranscription.text, true);
            } else if (message.serverContent?.inputTranscription) {
              this.onTranscript(message.serverContent.inputTranscription.text, false);
            }

            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              this.onStateChange('speaking');
              this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(
                decodeAudio(base64Audio),
                this.outputAudioContext,
                OUTPUT_SAMPLE_RATE,
                1
              );
              
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputAudioContext.destination);
              source.addEventListener('ended', () => {
                this.activeSources.delete(source);
                if (this.activeSources.size === 0) {
                  this.onStateChange('idle');
                }
              });
              source.start(this.nextStartTime);
              this.nextStartTime += audioBuffer.duration;
              this.activeSources.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.activeSources.forEach(s => s.stop());
              this.activeSources.clear();
              this.nextStartTime = 0;
              this.onStateChange('listening');
            }
          },
          onerror: (e) => this.onError(e),
          onclose: () => this.onStateChange('idle'),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION + "\n\nYou are in VOICE MODE. Speak naturally, concisely, and empathetically. Avoid long lists; instead, offer to explain one thing at a time.",
          outputAudioTranscription: {},
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
      
      // Basic VAD (Voice Activity Detection) proxy for UI state
      const rms = Math.sqrt(inputData.reduce((acc, val) => acc + val * val, 0) / inputData.length);
      if (rms > 0.01 && this.activeSources.size === 0) {
        this.onStateChange('listening');
      }

      const l = inputData.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = inputData[i] * 32768;
      }
      
      const pcmBase64 = encodeAudio(new Uint8Array(int16.buffer));
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
    this.activeSources.forEach(s => s.stop());
    this.activeSources.clear();
    this.micStream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
  }
}
