'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Plus, MessageSquare, BookOpen, AlertCircle, PanelLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '@/lib/api/ai';
import { studentAPI } from '@/lib/api/student';
import { adminAPI } from '@/lib/api/admin';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet';
import { apiErrorMessage, cn, formatRelativeTime } from '@/lib/utils';
import { subjectBn } from '@/lib/design/subjects';

/** Detects Bangla so the message can carry the right font and line-height. */
const hasBangla = (text: string) => /[ঀ-৿]/.test(text);

const isUser = (role?: string) => String(role).toUpperCase() === 'USER';

export default function AILearningPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [language, setLanguage] = useState<'EN' | 'BN'>('EN');
  const [historyOpen, setHistoryOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s._id === sessionId);
  const activeSubject =
    subjects.find((s) => s._id === (activeSession?.subjectId?._id ?? activeSession?.subjectId)) ??
    activeSession?.subjectId;

  const loadContext = useCallback(async () => {
    try {
      const dash = await studentAPI.getDashboard();
      const classId = dash.data.data.student?.classId?._id;
      if (classId) {
        const subRes = await adminAPI.getSubjects({ classId });
        setSubjects(subRes.data.data ?? []);
      }
      const sessRes = await aiAPI.getSessions();
      setSessions(sessRes.data.data ?? []);
    } catch {
      toast.error('Could not load your subjects');
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
      composerRef.current?.focus();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start a new chat'));
    } finally {
      setCreating(false);
    }
  };

  const openSession = async (id: string) => {
    setSessionId(id);
    setHistoryOpen(false);
    try {
      const res = await aiAPI.getSession(id);
      setMessages(res.data.data.messages ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open that chat'));
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !sessionId || sending) return;

    setMessages((prev) => [
      ...prev,
      { role: 'USER', content, createdAt: new Date().toISOString(), _local: true },
    ]);
    setInput('');
    setSending(true);

    try {
      const res = await aiAPI.sendMessage(sessionId, content);
      setMessages((prev) => [...prev, res.data.data.message]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content:
            'The AI assistant is unavailable right now. Everything else in SchoolOS is working — please try again in a little while.',
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
      ? ['আরও সহজ করে বলুন', 'একটি উদাহরণ দিন', 'সংক্ষেপে বলুন', 'Answer in English']
      : ['Explain it more simply', 'Give me an example', 'Summarise this', 'বাংলায় বলুন'];

  const subjectOptions = subjects.map((s: any) => ({
    value: s._id,
    label: s.name,
    hint: subjectBn(s) ?? s.code,
  }));

  const SessionList = (
    <div className="space-y-1">
      {!sessions.length ? (
        <p className="px-2 py-4 text-dense text-ink-subtle">No chats yet.</p>
      ) : (
        sessions.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => openSession(s._id)}
            className={cn(
              'w-full rounded-btn px-2.5 py-2 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              sessionId === s._id ? 'bg-wash text-brand' : 'text-ink-muted hover:bg-wash/60 hover:text-ink'
            )}
          >
            <span className="block truncate text-dense font-medium">
              {s.title || s.subjectId?.name || 'Chat'}
            </span>
            <span className="block text-meta text-ink-subtle">
              {formatRelativeTime(s.lastMessageAt || s.startedAt)}
            </span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-10rem)] gap-5 lg:h-[calc(100dvh-7rem)]">
      {/* Chat history rail */}
      <aside className="hidden w-60 shrink-0 flex-col gap-3 lg:flex">
        <div className="space-y-2 rounded-card border border-line bg-surface p-3">
          <Combobox
            options={subjectOptions}
            value={subjectId}
            onChange={setSubjectId}
            placeholder="Choose a subject"
            searchPlaceholder="Find a subject"
          />
          <div className="flex rounded-btn border border-line p-0.5">
            <LanguageButton active={language === 'EN'} onClick={() => setLanguage('EN')}>
              English
            </LanguageButton>
            <LanguageButton active={language === 'BN'} onClick={() => setLanguage('BN')} bangla>
              বাংলা
            </LanguageButton>
          </div>
          <Button className="w-full" onClick={createSession} loading={creating} disabled={!subjectId}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New chat
          </Button>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{SessionList}</div>
      </aside>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-surface">
        {/* Context bar: which subject this chat is grounded in. */}
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
                <span lang="bn" className="truncate font-bn text-meta text-ink-muted">
                  {subjectBn(activeSubject)}
                </span>
              )}
              <Badge tone="outline" className="ml-auto shrink-0">
                {language === 'BN' ? 'বাংলা' : 'English'}
              </Badge>
            </>
          ) : (
            <p className="text-dense text-ink-subtle">Choose a subject to begin</p>
          )}
        </div>

        {!sessionId ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="Ask about your textbook"
              description="Pick a subject and start a chat. Answers come from your NCTB textbook, and each one shows where it came from."
              action={
                <div className="w-64 space-y-2">
                  <Combobox
                    options={subjectOptions}
                    value={subjectId}
                    onChange={setSubjectId}
                    placeholder="Choose a subject"
                    searchPlaceholder="Find a subject"
                  />
                  <Button
                    className="w-full"
                    onClick={createSession}
                    loading={creating}
                    disabled={!subjectId}
                  >
                    Start a chat
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
                {!messages.length && (
                  <p className="text-center text-dense text-ink-subtle">
                    Ask your first question about {activeSubject?.name ?? 'this subject'}.
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg: any, i: number) => (
                    <motion.div
                      key={`${msg._id ?? i}-${msg.createdAt}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="space-y-1.5"
                    >
                      <p className="text-meta font-medium text-ink-subtle">
                        {isUser(msg.role) ? 'You' : 'SchoolOS'}
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

                      {/* Where the answer came from, as citation chips. */}
                      {!isUser(msg.role) && !msg._error && (
                        <SourceChips message={msg} subject={activeSubject} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {sending && (
                  <div className="space-y-1.5">
                    <p className="text-meta font-medium text-ink-subtle">SchoolOS</p>
                    <div className="inline-flex items-center gap-1.5 rounded-card border border-line bg-surface px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                      <span className="sr-only">Thinking</span>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-line p-3">
              <div className="mx-auto max-w-2xl space-y-2">
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
                    placeholder={
                      language === 'BN' ? 'আপনার প্রশ্ন লিখুন…' : 'Ask about your textbook…'
                    }
                    aria-label="Your question"
                    lang={hasBangla(input) ? 'bn' : undefined}
                    className={cn(
                      'max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-chip border border-line bg-surface px-3 py-2',
                      'text-body text-ink placeholder:text-ink-subtle',
                      'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25',
                      hasBangla(input) && 'font-bn'
                    )}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !input.trim()}
                    aria-label="Send"
                  >
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
            <div className="space-y-2">
              <Combobox
                options={subjectOptions}
                value={subjectId}
                onChange={setSubjectId}
                placeholder="Choose a subject"
                searchPlaceholder="Find a subject"
              />
              <div className="flex rounded-btn border border-line p-0.5">
                <LanguageButton active={language === 'EN'} onClick={() => setLanguage('EN')}>
                  English
                </LanguageButton>
                <LanguageButton active={language === 'BN'} onClick={() => setLanguage('BN')} bangla>
                  বাংলা
                </LanguageButton>
              </div>
              <Button
                className="w-full"
                onClick={createSession}
                loading={creating}
                disabled={!subjectId}
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                New chat
              </Button>
            </div>
            {SessionList}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * The API returns `sourceChunkIds` for a grounded answer. When it comes back
 * empty the answer was not found in the textbook, and the student is told so
 * plainly rather than being left to guess.
 */
function SourceChips({ message, subject }: { message: any; subject: any }) {
  const sources: any[] = message.sources ?? [];
  const chunkCount = message.sourceChunkIds?.length ?? 0;

  if (sources.length > 0) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-meta text-ink-subtle">From your textbook:</span>
        {sources.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-chip border border-line px-2 py-0.5 text-meta text-ink-muted"
          >
            <BookOpen className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
            {[s.documentTitle, s.chapter, s.pageNumber ? `p. ${s.pageNumber}` : null]
              .filter(Boolean)
              .join(' · ')}
          </span>
        ))}
      </div>
    );
  }

  if (chunkCount > 0) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-chip border border-line px-2 py-0.5 text-meta text-ink-muted">
          <BookOpen className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
          {subject?.name ?? 'Textbook'} · {chunkCount} {chunkCount === 1 ? 'passage' : 'passages'}
        </span>
      </div>
    );
  }

  return (
    <p className="text-meta text-ink-subtle">
      Not found in your textbook — ask your teacher to be sure.
    </p>
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
