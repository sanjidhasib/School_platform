'use client';
import { useEffect, useState, useRef } from 'react';
import { aiAPI } from '@/lib/api/ai';
import { studentAPI } from '@/lib/api/student';
import { adminAPI } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Plus, BookOpen, Bot, User, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AILearningPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [language, setLanguage] = useState<'EN' | 'BN'>('EN');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSubjectsAndSessions(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSubjectsAndSessions = async () => {
    try {
      const dash = await studentAPI.getDashboard();
      const classId = dash.data.data.student?.classId?._id;
      if (classId) { const subRes = await adminAPI.getSubjects({ classId }); setSubjects(subRes.data.data || []); }
      const sessRes = await aiAPI.getSessions();
      setSessions(sessRes.data.data || []);
    } catch { toast.error('Failed to load subjects'); }
  };

  const createSession = async () => {
    if (!selectedSubject) return toast.error('Please select a subject');
    setCreating(true);
    try {
      const res = await aiAPI.createSession({ subjectId: selectedSubject, preferredLanguage: language });
      const session = res.data.data;
      setSessions(prev => [session, ...prev]);
      setSelectedSessionId(session._id);
      setMessages([]);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to create session'); } finally { setCreating(false); }
  };

  const loadSession = async (id: string) => {
    setSelectedSessionId(id);
    try { const res = await aiAPI.getSession(id); setMessages(res.data.data.messages || []); } catch { toast.error('Failed to load session'); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedSessionId) return;
    const userMsg = { role: 'USER', content: input, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiAPI.sendMessage(selectedSessionId, input);
      setMessages(prev => [...prev, res.data.data.message]);
    } catch (err: any) {
      const errorMsg = { role: 'ASSISTANT', content: '⚠️ The AI service is temporarily unavailable. Please try again later. Your other school features work normally.', createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsg]);
    } finally { setLoading(false); }
  };

  const quickActions = ['Explain simpler', 'Give an example', 'Summarize this', language === 'EN' ? 'উত্তর বাংলায় দিন' : 'Answer in English'];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sessions sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <div className="flex gap-2">
            <Button size="sm" variant={language === 'EN' ? 'primary' : 'secondary'} onClick={() => setLanguage('EN')} className="flex-1 text-xs">EN</Button>
            <Button size="sm" variant={language === 'BN' ? 'primary' : 'secondary'} onClick={() => setLanguage('BN')} className="flex-1 text-xs">বাংলা</Button>
          </div>
          <Button size="sm" className="w-full" onClick={createSession} disabled={creating}><Plus className="h-3 w-3" />New Chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map(s => (
            <button key={s._id} onClick={() => loadSession(s._id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedSessionId === s._id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'}`}>
              <p className="truncate">{s.title || s.subjectId?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(s.startedAt)}</p>
            </button>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {!selectedSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4"><Bot className="h-8 w-8 text-blue-600" /></div>
            <h3 className="text-lg font-semibold text-slate-900">AI Learning Assistant</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Select a subject and start a new chat to ask questions about your NCTB textbook content.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'USER' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    {msg.role === 'USER' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-slate-600" />}
                  </div>
                  <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${msg.role === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.sourceChunkIds?.length > 0 && <p className="text-xs mt-2 opacity-60">📚 Based on approved textbook content</p>}
                  </div>
                </div>
              ))}
              {loading && <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><Bot className="h-4 w-4 text-slate-600" /></div><div className="bg-slate-100 rounded-xl px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay: `${i*0.15}s`}} />)}</div></div></div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-slate-200 p-3 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {quickActions.map(a => <button key={a} onClick={() => setInput(a)} className="text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors">{a}</button>)}
              </div>
              <div className="flex gap-2">
                <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={language === 'BN' ? 'আপনার প্রশ্ন লিখুন...' : 'Ask a question about your textbook...'} rows={2} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" className="self-end h-[68px] w-12"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
