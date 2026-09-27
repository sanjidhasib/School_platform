'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Plus,
  MessageSquare,
  BookOpen,
  AlertCircle,
  PanelLeft,
  Trash2,
  Info,
  Library,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '@/lib/api/ai';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet';
import { apiErrorMessage, cn, formatRelativeTime } from '@/lib/utils';
import { subjectBn } from '@/lib/design/subjects';

type Lang = 'EN' | 'BN';

/** Detects Bangla so the message can carry the right font and line-height. */
const hasBangla = (text: string) => /[ঀ-৿]/.test(text);
const isUser = (role?: string) => String(role).toUpperCase() === 'USER';
const bnDigits = (n: number | string) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

// useSearchParams needs a Suspense boundary to prerender.
export default function AILearningPageRoute() {
  return (
    <Suspense>
      <AILearningPage />
    </Suspense>
  );
}

function AILearningPage() {
  const search = useSearchParams();
  const [ctx, setCtx] = useState<any>(null);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subjectId, setSubjectId] = useState(search.get('subject') ?? '');
  const [language, setLanguage] = useState<Lang>('BN');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const subjects: any[] = ctx?.subjects ?? [];
  const activeSession = sessions.find((s) => s._id === sessionId);
  const activeSubjectId = activeSession?.subjectId?._id ?? activeSession?.subjectId;
  const activeSubject = subjects.find((s) => s._id === activeSubjectId) ?? activeSession?.subjectId;
  const chosenSubject = subjects.find((s) => s._id === subjectId);

  const loadContext = useCallback(async () => {
    setLoadingCtx(true);
    try {
      const [ctxRes, sessRes] = await Promise.all([aiAPI.getContext(), aiAPI.getSessions()]);
      setCtx(ctxRes.data.data);
      setSessions(sessRes.data.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load your subjects'));
    } finally {
      setLoadingCtx(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const createSession = async () => {
    if (!subjectId) {
      toast.error('Choose a subject first');
      return;
    }
    setCreating(true);
    try {
      const res = await aiAPI.createSession({ subjectId, preferredLanguage: language });
      const session = res.data.data;
      setSessions((prev) => [session, ...prev]);
      setSessionId(session._id);
      setMessages([]);
      setHistoryOpen(false);
      setTimeout(() => composerRef.current?.focus(), 50);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start a new chat'));
    } finally {
      setCreating(false);
    }
  };

  const openSession = async (id: string) => {
    setSessionId(id);
    setHistoryOpen(false);
    setMessages([]);
    setLoadingChat(true);
    try {
      const res = await aiAPI.getSession(id);
      setMessages(res.data.data.messages ?? []);
      const lang = res.data.data.session?.preferredLanguage;
      if (lang === 'EN' || lang === 'BN') setLanguage(lang);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open that chat'));
    } finally {
      setLoadingChat(false);
    }
  };

  /** In a chat, the language switch changes how the next answers are written. */
  const changeLanguage = (lang: Lang) => {
    setLanguage(lang);
    if (!sessionId) return;
    setSessions((prev) => prev.map((s) => (s._id === sessionId ? { ...s, preferredLanguage: lang } : s)));
    aiAPI.updateSession(sessionId, { preferredLanguage: lang }).catch(() => {
      toast.error('Could not change the answer language');
    });
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await aiAPI.deleteSession(deleting._id);
      setSessions((prev) => prev.filter((s) => s._id !== deleting._id));
      if (sessionId === deleting._id) {
        setSessionId(null);
        setMessages([]);
      }
      setDeleting(null);
      toast.success('Chat deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the chat'));
    } finally {
      setRemoving(false);
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !sessionId || sending) return;

    const localId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { _id: localId, role: 'user', content, createdAt: new Date().toISOString() },
    ]);
    setInput('');
    if (composerRef.current) composerRef.current.style.height = 'auto';
    setSending(true);

    try {
      const res = await aiAPI.sendMessage(sessionId, content);
      const { userMessage, message } = res.data.data;
      setMessages((prev) => [...prev.map((m) => (m._id === localId ? userMessage ?? m : m)), message]);
      // The first question becomes the chat's title in the history list.
      setSessions((prev) => {
        const current = prev.find((s) => s._id === sessionId);
        const rest = prev.filter((s) => s._id !== sessionId);
        if (!current) return prev;
        const isFirst = messages.filter((m) => isUser(m.role)).length === 0;
        return [
          {
            ...current,
            title: isFirst ? (content.length > 60 ? `${content.slice(0, 57)}…` : content) : current.title,
            lastMessageAt: new Date().toISOString(),
          },
          ...rest,
        ];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: apiErrorMessage(
            err,
            'The study helper could not answer just now. Please try again in a moment.'
          ),
          createdAt: new Date().toISOString(),
          _error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const quickReplies =
    language === 'BN'
      ? ['আরও সহজ করে বলো', 'একটি উদাহরণ দাও', 'সংক্ষেপে বলো', 'Answer in English']
      : ['Explain it more simply', 'Give me an example', 'Summarise this', 'বাংলায় বলো'];

  const subjectOptions = subjects.map((s: any) => ({
    value: s._id,
    label: s.name,
    hint: [subjectBn(s), s.aiReady ? 'Book ready' : 'No book yet'].filter(Boolean).join(' · '),
  }));

  const className = ctx?.class ? `${ctx.class.name}${ctx.class.section ? ` ${ctx.class.section}` : ''}` : '';

  const startControls = (fullWidth?: boolean) => (
    <div className={cn('space-y-2', fullWidth ? 'w-full' : 'w-72')}>
      <Combobox
        options={subjectOptions}
        value={subjectId}
        onChange={setSubjectId}
        placeholder="Choose a subject"
        searchPlaceholder="Find a subject"
      />
      <LanguageSwitch value={language} onChange={setLanguage} />
      {chosenSubject && !chosenSubject.aiReady && (
        <p className="text-left text-meta text-ink-subtle">
          This subject&apos;s textbook hasn&apos;t been added yet, so answers can&apos;t come from the book.
        </p>
      )}
      <Button className="w-full" onClick={createSession} loading={creating} disabled={!subjectId}>
        <Plus className="h-4 w-4" strokeWidth={1.75} />
        New chat
      </Button>
    </div>
  );

  const SessionList = (
    <div className="space-y-1">
      {!sessions.length ? (
        <p className="px-2 py-4 text-dense text-ink-subtle">No chats yet.</p>
      ) : (
        sessions.map((s) => (
          <div
            key={s._id}
            className={cn(
              'group flex items-center rounded-btn transition-colors',
              sessionId === s._id ? 'bg-wash' : 'hover:bg-wash/60'
            )}
          >
            <button
              type="button"
              onClick={() => openSession(s._id)}
              className="min-w-0 flex-1 rounded-btn px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span
                lang={hasBangla(s.title ?? '') ? 'bn' : undefined}
                className={cn(
                  'block truncate text-dense font-medium',
                  sessionId === s._id ? 'text-brand' : 'text-ink',
                  hasBangla(s.title ?? '') && 'font-bn'
                )}
              >
                {s.title || s.subjectId?.name || 'Chat'}
              </span>
              <span className="block truncate text-meta text-ink-subtle">
                {s.subjectId?.name ? `${s.subjectId.name} · ` : ''}
                {formatRelativeTime(s.lastMessageAt || s.updatedAt || s.createdAt)}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleting(s)}
              aria-label={`Delete chat ${s.title ?? ''}`}
              className="mr-1 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        ))
      )}
    </div>
  );

  if (loadingCtx) {
    return (
      <div className="flex h-[calc(100dvh-10rem)] gap-5 lg:h-[calc(100dvh-7rem)]">
        <Skeleton className="hidden w-64 rounded-card lg:block" />
        <Skeleton className="flex-1 rounded-card" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] gap-5 lg:h-[calc(100dvh-7rem)]">
      {/* Chat history rail */}
      <aside className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
        <div className="space-y-3 rounded-card border border-line bg-surface p-3 shadow-card">
          {className && (
            <p className="text-meta text-ink-subtle">
              Answers from the NCTB books for <span className="font-medium text-ink">{className}</span>
            </p>
          )}
          {startControls(true)}
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{SessionList}</div>
      </aside>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setHistoryOpen(true)}
            aria-label="Chats and subject"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>

          {sessionId ? (
            <>
              <BookOpen className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
              <p className="min-w-0 truncate text-dense font-medium text-ink">
                {activeSubject?.name ?? 'Textbook'}
              </p>
              {subjectBn(activeSubject) && (
                <span lang="bn" className="hidden truncate font-bn text-meta text-ink-muted sm:inline">
                  {subjectBn(activeSubject)}
                </span>
              )}
              {className && (
                <span className="hidden shrink-0 text-meta text-ink-subtle sm:inline">· {className}</span>
              )}
              <div className="ml-auto w-40 shrink-0">
                <LanguageSwitch value={language} onChange={changeLanguage} />
              </div>
            </>
          ) : (
            <p className="text-dense text-ink-subtle">Choose a subject to begin</p>
          )}
        </div>

        {ctx && !ctx.ai?.available && sessionId && (
          <div className="flex shrink-0 items-start gap-2 border-b border-line bg-info-bg px-4 py-2 text-meta text-info">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>
              Full AI answers aren&apos;t switched on yet. For now you&apos;ll get the matching pages from your
              textbook — tap a page to read it.
            </span>
          </div>
        )}

        {!sessionId ? (
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
            <EmptyState
              icon={MessageSquare}
              title="Ask about your textbook"
              description={`Pick a subject and ask in Bangla or English. Answers come from your ${
                className ? `${className} ` : ''
              }NCTB textbook, and each one shows the page it came from.`}
              action={
                <div className="space-y-3">
                  {startControls()}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/student/library">
                      <Library className="h-4 w-4" strokeWidth={1.75} />
                      Read your books in the library
                    </Link>
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
                {loadingChat && (
                  <div className="space-y-3">
                    <Skeleton className="ml-auto h-10 w-2/3 rounded-card" />
                    <Skeleton className="h-24 w-full rounded-card" />
                  </div>
                )}

                {!loadingChat && !messages.length && (
                  <p className="text-center text-dense text-ink-subtle">
                    {language === 'BN' ? (
                      <span lang="bn" className="font-bn">
                        {subjectBn(activeSubject) ?? activeSubject?.name} নিয়ে তোমার প্রথম প্রশ্নটি লেখো।
                      </span>
                    ) : (
                      `Ask your first question about ${activeSubject?.name ?? 'this subject'}.`
                    )}
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg: any, i: number) => (
                    <motion.div
                      key={msg._id ?? `${i}-${msg.createdAt}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="space-y-1.5"
                    >
                      <p className="text-meta font-medium text-ink-subtle">
                        {isUser(msg.role) ? 'You' : 'Study helper'}
                      </p>

                      <div
                        className={cn(
                          'rounded-card px-4 py-3',
                          isUser(msg.role)
                            ? 'bg-wash'
                            : msg._error
                              ? 'border border-warning/30 bg-warning-bg'
                              : 'border border-line bg-surface'
                        )}
                      >
                        {msg._error && (
                          <AlertCircle
                            className="mb-1.5 h-4 w-4 text-warning"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        )}
                        <p
                          lang={hasBangla(msg.content) ? 'bn' : undefined}
                          className={cn(
                            'whitespace-pre-wrap text-body text-ink',
                            hasBangla(msg.content) && 'font-bn leading-[1.75]'
                          )}
                        >
                          {msg.content}
                        </p>
                      </div>

                      {!isUser(msg.role) && !msg._error && <SourceChips message={msg} />}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {sending && (
                  <div className="space-y-1.5">
                    <p className="text-meta font-medium text-ink-subtle">Study helper</p>
                    <div className="inline-flex items-center gap-1.5 rounded-card border border-line bg-surface px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                      <span className="sr-only">Looking in your textbook</span>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-line p-3">
              <div className="mx-auto max-w-2xl space-y-2">
                {messages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickReplies.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        disabled={sending}
                        lang={hasBangla(q) ? 'bn' : undefined}
                        className={cn(
                          'rounded-chip border border-line px-2.5 py-1 text-meta text-ink-muted transition-colors',
                          'hover:border-line-strong hover:text-ink disabled:opacity-50',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                          hasBangla(q) && 'font-bn'
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    ref={composerRef}
                    value={input}
                    maxLength={2000}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Grow with the text, up to a limit, without jumping.
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder={language === 'BN' ? 'তোমার প্রশ্ন লেখো…' : 'Ask about your textbook…'}
                    aria-label="Your question"
                    lang={hasBangla(input) || language === 'BN' ? 'bn' : undefined}
                    className={cn(
                      'max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-chip border border-line bg-surface px-3 py-2',
                      'text-body text-ink placeholder:text-ink-subtle',
                      'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25',
                      (hasBangla(input) || language === 'BN') && 'font-bn'
                    )}
                  />
                  <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Send">
                    <Send className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Your chats</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            {className && (
              <p className="text-meta text-ink-subtle">
                Answers from the NCTB books for <span className="font-medium text-ink">{className}</span>
              </p>
            )}
            {startControls(true)}
            {SessionList}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this chat?"
        description={
          <>
            <strong className="text-ink">{deleting?.title || 'This chat'}</strong> and all its messages will
            be removed.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/**
 * Every grounded answer shows the pages it came from; each chip opens the
 * book at that page. An answer with no pages says so plainly.
 */
function SourceChips({ message }: { message: any }) {
  const sources: any[] = message.sources ?? [];

  if (message.mode === 'NOT_FOUND' || (!sources.length && message.mode)) {
    return (
      <p className="text-meta text-ink-subtle">Not found in your textbook — ask your teacher to be sure.</p>
    );
  }
  if (!sources.length) return null;

  // One chip per page, even when two passages came from the same page.
  const unique = sources.filter(
    (s, i) =>
      sources.findIndex((o) => String(o.documentId) === String(s.documentId) && o.pageNumber === s.pageNumber) === i
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-meta text-ink-subtle">From your textbook:</span>
      {unique.map((s, i) => {
        const bangla = s.language === 'BN';
        const label = bangla ? `বাংলা ভার্সন · পৃ. ${bnDigits(s.pageNumber)}` : `English version · p. ${s.pageNumber}`;
        const chip = (
          <>
            <BookOpen className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span lang={bangla ? 'bn' : undefined} className={cn(bangla && 'font-bn')}>
              {label}
            </span>
          </>
        );
        return s.documentId ? (
          <Link
            key={i}
            href={`/student/library/${s.documentId}?page=${s.pageNumber ?? 1}`}
            title={[s.documentTitle, s.chapter].filter(Boolean).join(' — ')}
            className={cn(
              'inline-flex items-center gap-1 rounded-chip border border-line px-2 py-0.5 text-meta text-ink-muted transition-colors',
              'hover:border-brand/40 hover:bg-brand-wash hover:text-brand',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
            )}
          >
            {chip}
          </Link>
        ) : (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-chip border border-line px-2 py-0.5 text-meta text-ink-muted"
          >
            {chip}
          </span>
        );
      })}
    </div>
  );
}

function LanguageSwitch({ value, onChange }: { value: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div className="flex rounded-btn border border-line p-0.5" role="group" aria-label="Answer language">
      <LanguageButton active={value === 'BN'} onClick={() => onChange('BN')} bangla>
        বাংলা
      </LanguageButton>
      <LanguageButton active={value === 'EN'} onClick={() => onChange('EN')}>
        English
      </LanguageButton>
    </div>
  );
}

function LanguageButton({
  active,
  onClick,
  children,
  bangla,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  bangla?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      lang={bangla ? 'bn' : undefined}
      className={cn(
        'h-7 flex-1 rounded-chip text-meta font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        bangla && 'font-bn',
        active ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}
