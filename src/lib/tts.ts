export interface TtsCallbacks {
  onSentence?: (index: number) => void;
  onWord?: (charIndex: number) => void;
  onDone?: () => void;
}

export class Narrator {
  private sentences: string[] = [];
  private index = 0;
  private rate = 1;
  private voice: SpeechSynthesisVoice | null = null;
  private playing = false;
  private callbacks: TtsCallbacks = {};

  setSentences(sentences: string[], startAt = 0) {
    this.sentences = sentences;
    this.index = startAt;
  }

  setRate(rate: number) {
    this.rate = rate;
    if (this.playing) {
      this.speakCurrent();
    }
  }

  setVoice(voice: SpeechSynthesisVoice | null) {
    this.voice = voice;
  }

  setCallbacks(callbacks: TtsCallbacks) {
    this.callbacks = callbacks;
  }

  get currentIndex() {
    return this.index;
  }

  get isPlaying() {
    return this.playing;
  }

  play() {
    if (!this.sentences.length) return;
    this.playing = true;
    this.speakCurrent();
  }

  pause() {
    this.playing = false;
    window.speechSynthesis.cancel();
  }

  stop() {
    this.playing = false;
    this.index = 0;
    window.speechSynthesis.cancel();
  }

  goTo(index: number) {
    window.speechSynthesis.cancel();
    this.index = Math.max(0, Math.min(this.sentences.length - 1, index));
    if (this.playing) this.speakCurrent();
    else this.callbacks.onSentence?.(this.index);
  }

  private speakCurrent() {
    window.speechSynthesis.cancel();
    const text = this.sentences[this.index];
    if (text === undefined) {
      this.playing = false;
      this.callbacks.onDone?.();
      return;
    }
    this.callbacks.onSentence?.(this.index);

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = this.rate;
    utter.lang = 'pt-BR';
    if (this.voice) utter.voice = this.voice;

    utter.onboundary = (e) => {
      if (e.name === 'word') this.callbacks.onWord?.(e.charIndex);
    };

    utter.onend = () => {
      if (!this.playing) return;
      this.index += 1;
      if (this.index >= this.sentences.length) {
        this.playing = false;
        this.callbacks.onDone?.();
        return;
      }
      this.speakCurrent();
    };

    utter.onerror = () => {
      this.playing = false;
    };

    window.speechSynthesis.speak(utter);
  }
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export function ptBrVoices(voices: SpeechSynthesisVoice[]) {
  const pt = voices.filter((v) => v.lang?.toLowerCase().startsWith('pt'));
  return pt.length ? pt : voices;
}
