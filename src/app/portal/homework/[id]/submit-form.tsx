'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, NotebookPen, PenLine, Mic, Square, Trash2, X, Play } from 'lucide-react';
import { submitHomeworkAction, type SubmitHomeworkState } from '@/services/portal/homework';
import { cn } from '@/lib/utils';

type Mode = 'type' | 'upload' | 'draw' | 'voice';

const MODES: { key: Mode; label: string; icon: typeof NotebookPen }[] = [
  { key: 'type', label: 'Type', icon: NotebookPen },
  { key: 'upload', label: 'Upload', icon: Paperclip },
  { key: 'draw', label: 'Draw', icon: PenLine },
  { key: 'voice', label: 'Voice', icon: Mic },
];

export function SubmitHomeworkForm({
  submissionId,
  defaultContent,
  resubmit,
}: {
  submissionId: string;
  defaultContent: string | null;
  resubmit: boolean;
}) {
  const [mode, setMode] = useState<Mode>('type');
  const [content, setContent] = useState(defaultContent ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<SubmitHomeworkState>({});

  // ---- Drawing canvas ---------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Size the backing store to the element for crisp lines.
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#312e81';
    }
  }, [mode]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }
  function endDraw() {
    drawing.current = false;
  }
  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }
  function canvasToBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return resolve(null);
      canvas.toBlob((b) => resolve(b), 'image/png');
    });
  }

  // ---- Voice recorder ---------------------------------------------------
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;

  useEffect(() => {
    setVoiceSupported(
      typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined',
    );
  }, []);
  // Revoke the temporary object URL when the clip changes/unmounts.
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setState({ error: 'Could not access the microphone.' });
    }
  }
  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  // ---- Submit -----------------------------------------------------------
  const hasAnything = content.trim().length > 0 || files.length > 0 || hasDrawn || !!audioBlob;

  async function handleSubmit() {
    setState({});
    if (!hasAnything) {
      setState({ error: 'Add your answer in any format before submitting.' });
      return;
    }
    setPending(true);
    try {
      const fd = new FormData();
      fd.set('submissionId', submissionId);
      fd.set('content', content);
      files.forEach((f) => fd.append('files', f));
      const drawn = await canvasToBlob();
      if (drawn) fd.append('files', new File([drawn], `notebook-${Date.now()}.png`, { type: 'image/png' }));
      if (audioBlob) {
        const ext = (audioBlob.type.split('/')[1] || 'webm').split(';')[0];
        fd.append('files', new File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: audioBlob.type }));
      }
      const res = await submitHomeworkAction({}, fd);
      setState(res);
      if (res.success) {
        setFiles([]);
        setAudioBlob(null);
        clearCanvas();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-brand-900">Your answer</p>

      {/* Method picker */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => {
          if (m.key === 'voice' && !voiceSupported) return null;
          const Icon = m.icon;
          const on = mode === m.key;
          const filled =
            (m.key === 'type' && content.trim()) ||
            (m.key === 'upload' && files.length > 0) ||
            (m.key === 'draw' && hasDrawn) ||
            (m.key === 'voice' && !!audioBlob);
          return (
            <button
              type="button"
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition',
                on
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300',
              )}
            >
              <Icon className="h-4 w-4" /> {m.label}
              {filled && <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-white' : 'bg-emerald-500')} />}
            </button>
          );
        })}
      </div>

      {/* Type */}
      {mode === 'type' && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Type your answers here…"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      )}

      {/* Upload */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center hover:border-indigo-300">
            <Paperclip className="h-6 w-6 text-indigo-500" />
            <span className="text-sm font-semibold text-brand-900">Tap to add photos or files</span>
            <span className="text-xs text-slate-400">Snap your working, or add a document — up to 15MB each.</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
          </label>
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))} aria-label="Remove">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Draw */}
      {mode === 'draw' && (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="w-full touch-none rounded-2xl border border-slate-200 bg-white"
            style={{ height: 240 }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Write or draw your working with your finger or stylus.</span>
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Voice */}
      {mode === 'voice' && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="mx-auto inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
            >
              <Mic className="h-4 w-4" /> {audioBlob ? 'Record again' : 'Start recording'}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="mx-auto inline-flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2.5 text-sm font-bold text-white"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          )}
          {recording && (
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-rose-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-600" /> Recording…
            </p>
          )}
          {audioBlob && audioUrl && !recording && (
            <div className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4 text-slate-400" />
              <audio controls src={audioUrl} className="h-9" />
              <button type="button" onClick={() => setAudioBlob(null)} aria-label="Delete recording">
                <Trash2 className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Submitted! Your tutor will review it. 🎉
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {pending ? 'Submitting…' : resubmit ? 'Resubmit homework' : 'Submit homework'}
      </button>
    </div>
  );
}
