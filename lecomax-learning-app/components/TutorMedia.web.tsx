import React, { useEffect, useRef, useState } from 'react';
import { Button, Label, Row } from './UI';
import { useSchool } from '../store/School';
import { readAttachment, type TutorAttachment } from '../utils/tutor-contract';
import type { TutorMediaProps } from './TutorMedia';
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
export function TutorMedia({
  onAttachment,
  onTranscript,
  onError,
  answer,
  language,
  disabled,
}: TutorMediaProps) {
  const { t } = useSchool();
  const file = useRef<HTMLInputElement>(null);
  const recording = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const api =
    typeof window === 'undefined'
      ? undefined
      : (window as unknown as {
          SpeechRecognition?: new () => Recognition;
          webkitSpeechRecognition?: new () => Recognition;
        });
  const RecognitionAPI = api?.SpeechRecognition || api?.webkitSpeechRecognition;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(
    () => () => {
      if (recording.current) {
        recording.current.onend = null;
        recording.current.onerror = null;
        recording.current.onresult = null;
        recording.current.abort();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window)
        window.speechSynthesis.cancel();
    },
    [],
  );
  useEffect(() => {
    if (disabled) recording.current?.stop();
  }, [disabled]);
  async function attach(chosen?: File) {
    if (!chosen) return;
    try {
      if (chosen.size > 2_000_000)
        throw new Error(t('Maximum : 2 Mo.', 'Maximum: 2 MB.', 'الحد الأقصى: ٢ ميغابايت.'));
      const mime = chosen.type || (chosen.name.endsWith('.txt') ? 'text/plain' : '');
      if (!['image/jpeg', 'image/png', 'application/pdf', 'text/plain'].includes(mime))
        throw new Error(
          t(
            'Formats : JPG, PNG, PDF, TXT.',
            'Formats: JPG, PNG, PDF, TXT.',
            'الصيغ: JPG، PNG، PDF، TXT.',
          ),
        );
      const data =
        mime === 'text/plain'
          ? await chosen.text()
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
              reader.readAsDataURL(chosen);
            });
      onAttachment(readAttachment({ name: chosen.name, mime, data } as TutorAttachment));
    } catch (e) {
      onError(e instanceof Error ? e.message : 'FILE_READ_FAILED');
    }
    if (file.current) file.current.value = '';
  }
  return (
    <>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,application/pdf,text/plain"
        style={{ display: 'none' }}
        onChange={(e) => {
          void attach(e.target.files?.[0]);
        }}
      />
      <Row>
        <Button
          quiet
          disabled={disabled}
          title={t('Joindre image / document', 'Attach image / document', 'إرفاق صورة / مستند')}
          onPress={() => file.current?.click()}
        />
        {RecognitionAPI && (
          <Button
            quiet
            disabled={disabled}
            title={
              listening
                ? t('Arrêter le micro', 'Stop microphone', 'إيقاف الميكروفون')
                : t('Dicter', 'Dictate', 'إملاء')
            }
            onPress={() => {
              if (listening) {
                recording.current?.stop();
                return;
              }
              const recognition = new RecognitionAPI();
              recording.current = recognition;
              recognition.lang = language;
              recognition.continuous = false;
              recognition.interimResults = false;
              recognition.onresult = (event) =>
                onTranscript(
                  Array.from(
                    { length: event.results.length },
                    (_, i) => event.results[i]![0]!.transcript,
                  ).join(' '),
                );
              recognition.onerror = (event) => {
                setListening(false);
                onError(
                  event.error === 'not-allowed'
                    ? t(
                        'Microphone refusé. Autorisez-le dans le navigateur ou écrivez votre réponse.',
                        'Microphone denied. Allow it in the browser or type your answer.',
                        'رُفض الميكروفون. اسمح به في المتصفح أو اكتب إجابتك.',
                      )
                    : t(
                        'Dictée indisponible. Réessayez ou écrivez.',
                        'Dictation unavailable. Retry or type.',
                        'الإملاء غير متاح. أعد المحاولة أو اكتب.',
                      ),
                );
              };
              recognition.onend = () => setListening(false);
              try {
                setListening(true);
                recognition.start();
              } catch {
                setListening(false);
                onError('MICROPHONE_UNAVAILABLE');
              }
            }}
          />
        )}
        {canSpeak && !!answer && (
          <>
            <Button
              quiet
              title={speaking ? t('Pause', 'Pause', 'إيقاف مؤقت') : t('Écouter', 'Listen', 'استمع')}
              onPress={() => {
                if (speaking) {
                  window.speechSynthesis.pause();
                  setSpeaking(false);
                  return;
                }
                if (window.speechSynthesis.paused) {
                  window.speechSynthesis.resume();
                  setSpeaking(true);
                  return;
                }
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(answer.slice(0, 6000));
                utterance.lang = language;
                utterance.onend = () => setSpeaking(false);
                utterance.onerror = () => {
                  setSpeaking(false);
                  onError('AUDIO_UNAVAILABLE');
                };
                window.speechSynthesis.speak(utterance);
                setSpeaking(true);
              }}
            />
            <Button
              quiet
              title={t('Arrêter audio', 'Stop audio', 'إيقاف الصوت')}
              onPress={() => {
                window.speechSynthesis.cancel();
                setSpeaking(false);
              }}
            />
          </>
        )}
      </Row>
      {listening && <Label>{t('Écoute en cours…', 'Listening…', 'جارٍ الاستماع…')}</Label>}
      <Label muted size={12}>
        {t(
          'Les fichiers sont envoyés au service IA avec votre question, sans copie locale persistante. La dictée peut utiliser le service du navigateur. Transcription ≠ évaluation de prononciation.',
          'Files are sent to the AI service with your question, without a persistent local copy. Dictation may use your browser’s speech service. Transcription is not pronunciation assessment.',
          'تُرسل الملفات إلى خدمة الذكاء مع سؤالك دون حفظ نسخة محلية دائمة. قد يستخدم الإملاء خدمة المتصفح. تحويل الصوت إلى نص ليس تقييماً للنطق.',
        )}
      </Label>
    </>
  );
}
