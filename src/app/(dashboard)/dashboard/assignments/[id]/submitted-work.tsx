import { Paperclip } from 'lucide-react';
import type { AttachedFile } from '@/services/assignments';

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp'];
const AUDIO_EXT = ['webm', 'mp3', 'm4a', 'ogg', 'wav', 'aac', 'oga'];

function ext(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Renders a learner's submitted answer for the grading table: the typed
 * notebook text, plus inline previews for images (thumbnail) and voice notes
 * (audio player). Anything else stays a download link.
 */
export function SubmittedWork({
  content,
  files,
}: {
  content: string | null;
  files: AttachedFile[];
}) {
  if (!content && files.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="max-w-xs space-y-2">
      {content && (
        <p className="whitespace-pre-wrap text-xs text-muted-foreground line-clamp-4">{content}</p>
      )}

      {files.map((f) => {
        const e = ext(f.name);

        if (f.url && IMAGE_EXT.includes(e)) {
          return (
            <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.name}
                className="max-h-40 w-auto rounded-lg border object-contain"
                loading="lazy"
              />
            </a>
          );
        }

        if (f.url && AUDIO_EXT.includes(e)) {
          return (
            <audio key={f.id} controls preload="none" src={f.url} className="h-9 w-full max-w-[240px]" />
          );
        }

        return f.url ? (
          <a
            key={f.id}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border bg-muted/40 px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            <Paperclip className="h-3 w-3" /> {f.name}
          </a>
        ) : (
          <span key={f.id} className="text-xs text-muted-foreground">{f.name}</span>
        );
      })}
    </div>
  );
}
