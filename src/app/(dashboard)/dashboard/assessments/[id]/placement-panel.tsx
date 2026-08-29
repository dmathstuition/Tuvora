'use client';

import { useActionState, useEffect, useState } from 'react';
import { Sparkles, UserPlus } from 'lucide-react';
import {
  generatePlacementQuestionsAction,
  assignPlacementAction,
  type PlacementState,
} from '@/services/placement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const base =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PlacementPanel({
  assessmentId,
  learners,
  aiEnabled,
}: {
  assessmentId: string;
  learners: { id: string; name: string }[];
  aiEnabled: boolean;
}) {
  const [openGen, setOpenGen] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);

  const [genState, genAction, genPending] = useActionState<PlacementState, FormData>(
    generatePlacementQuestionsAction,
    {},
  );
  const [assignState, assignAction, assignPending] = useActionState<PlacementState, FormData>(
    assignPlacementAction,
    {},
  );

  useEffect(() => {
    if (genState.success) setOpenGen(false);
  }, [genState.success]);
  useEffect(() => {
    if (assignState.success) setOpenAssign(false);
  }, [assignState.success]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpenGen(true)}>
        <Sparkles className="h-4 w-4" /> Generate with AI
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpenAssign(true)}>
        <UserPlus className="h-4 w-4" /> Assign to learner
      </Button>

      {openGen && (
        <Modal title="Generate placement questions" onClose={() => setOpenGen(false)}>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-generate multiple-choice aptitude questions.
          </p>
          <div
            className={`mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
              aiEnabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>
              {aiEnabled
                ? 'AI generation is active — questions are authored by Claude.'
                : 'No AI key configured — questions come from the built-in generator. Set ANTHROPIC_API_KEY to enable AI-authored questions.'}
            </span>
          </div>
          <form action={genAction} className="mt-4 space-y-4">
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <select name="subject" className={`${base} h-10`} defaultValue="maths">
                  <option value="maths">Maths</option>
                  <option value="english">English / verbal</option>
                  <option value="reasoning">Reasoning</option>
                  <option value="science">Science</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <select name="difficulty" className={`${base} h-10`} defaultValue="medium">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Number of questions</Label>
              <Input id="count" name="count" type="number" min={1} max={20} defaultValue={5} />
            </div>
            {genState.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {genState.error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenGen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={genPending}>
                {genPending ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {openAssign && (
        <Modal title="Assign placement test" onClose={() => setOpenAssign(false)}>
          {learners.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Add a learner first, then assign this test to them.
            </p>
          ) : (
            <form action={assignAction} className="mt-4 space-y-4">
              <input type="hidden" name="assessmentId" value={assessmentId} />
              <div className="space-y-2">
                <Label htmlFor="learnerId">Learner</Label>
                <select id="learnerId" name="learnerId" className={`${base} h-10`}>
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                The learner will see this test in their portal and can take it there.
              </p>
              {assignState.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {assignState.error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenAssign(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={assignPending}>
                  {assignPending ? 'Assigning…' : 'Assign'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
