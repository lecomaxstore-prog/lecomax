export type DictationState = "idle" | "starting" | "listening" | "stopping";
type SpeechResult = { readonly length: number; readonly [index: number]: { readonly 0: { transcript: string } } };
export interface ChatRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: SpeechResult }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionConstructor = new () => ChatRecognition;

export function createChatDictation(options: {
  Recognition: RecognitionConstructor;
  draft: string;
  onText: (text: string) => void;
  onState: (state: DictationState) => void;
  onError: (message: string) => void;
}) {
  const recognition = new options.Recognition();
  recognition.lang = "fr-FR";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  let finished = false;
  let stopping = false;
  let receivedText = false;
  let failed = false;
  let limitTimer: ReturnType<typeof setTimeout> | undefined;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(limitTimer);
    clearTimeout(stopTimer);
    recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
    options.onState("idle");
  };
  const cancel = () => {
    finish();
    try { recognition.abort(); } catch { /* Already stopped. */ }
  };
  const stop = () => {
    if (finished || stopping) return;
    stopping = true;
    options.onState("stopping");
    stopTimer = setTimeout(cancel, 2000);
    try { recognition.stop(); } catch { cancel(); }
  };
  recognition.onstart = () => { if (!finished && !stopping) options.onState("listening"); };
  recognition.onresult = event => {
    if (finished) return;
    const parts: string[] = [];
    for (let i = 0; i < event.results.length; i++) parts.push(event.results[i][0].transcript.trim());
    const transcript = parts.filter(Boolean).join(" ");
    if (!transcript) return;
    receivedText = true;
    const text = [options.draft.trimEnd(), transcript].filter(Boolean).join(" ");
    options.onText(text.slice(0, 2000));
    if (text.length >= 2000) stop();
  };
  recognition.onerror = event => {
    if (finished) return;
    failed = true;
    const messages: Record<string, string> = {
      "not-allowed": "Autorisez le microphone dans les paramètres du navigateur, puis réessayez.",
      "service-not-allowed": "La dictée vocale est bloquée par votre navigateur. Vous pouvez saisir votre message.",
      "audio-capture": "Aucun microphone disponible. Vérifiez qu’il est connecté et accessible.",
      "network": "La connexion à la dictée a échoué. Vérifiez votre connexion, puis réessayez.",
      "no-speech": "Aucune voix détectée. Appuyez sur le micro et réessayez.",
      "language-not-supported": "La dictée en français n’est pas disponible dans ce navigateur.",
    };
    if (event.error !== "aborted") options.onError(messages[event.error] || "La dictée s’est interrompue. Votre texte est conservé, vous pouvez réessayer.");
    cancel();
  };
  recognition.onend = () => {
    if (finished) return;
    if (!receivedText && !failed) options.onError("Aucune voix détectée. Appuyez sur le micro et réessayez.");
    finish();
  };
  return {
    start() {
      options.onState("starting");
      limitTimer = setTimeout(stop, 60_000);
      try { recognition.start(); }
      catch { options.onError("Le microphone n’a pas pu démarrer. Vérifiez son autorisation, puis réessayez."); cancel(); }
    },
    stop,
    cancel,
  };
}
