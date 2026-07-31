import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { splitIntoSentences } from '../lib/text';
import { Narrator, loadVoices, ptBrVoices } from '../lib/tts';
import { RoundIconButton } from '../components/ui';
import { IconArrowLeft, IconSettings, IconChevronsLeft, IconChevronsRight, IconPlay, IconPause, IconCheck } from '../components/Icon';
import type { Book, ReaderTheme, UserSettings } from '../types';

const THEMES: Record<ReaderTheme, { bg: string; fg: string; dim: string; chrome: string; border: string; sentBg: string; wordBg: string }> = {
  claro: { bg: '#faf3e6', fg: '#201e1d', dim: 'rgba(32,30,29,0.45)', chrome: '#efe3cd', border: 'rgba(32,30,29,0.12)', sentBg: 'rgba(198,113,57,0.17)', wordBg: 'rgba(198,113,57,0.45)' },
  sepia: { bg: '#f0e0c0', fg: '#3a2c1c', dim: 'rgba(58,44,28,0.45)', chrome: '#e5d2a9', border: 'rgba(58,44,28,0.14)', sentBg: 'rgba(166,90,40,0.2)', wordBg: 'rgba(166,90,40,0.45)' },
  escuro: { bg: '#1b1917', fg: '#ece2d0', dim: 'rgba(236,226,208,0.4)', chrome: '#272320', border: 'rgba(236,226,208,0.13)', sentBg: 'rgba(198,113,57,0.26)', wordBg: 'rgba(198,113,57,0.58)' },
};

const SPEEDS = [0.5, 1, 1.5, 2];

export default function Reader() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [page, setPage] = useState(1);
  const [sentIndex, setSentIndex] = useState(0);
  const [wordCharIndex, setWordCharIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [toast, setToast] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(true);

  const narratorRef = useRef<Narrator>(new Narrator());
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id || !user) return;
      setLoading(true);
      const [{ data: b }, { data: p }, { data: s }] = await Promise.all([
        supabase.from('br_books').select('*').eq('id', id).single(),
        supabase.from('br_reading_progress').select('*').eq('book_id', id).maybeSingle(),
        supabase.from('br_user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setBook(b);
      setPage(p?.current_page && p.current_page > 0 ? p.current_page : 1);
      setSentIndex(p?.position_in_page ?? 0);
      setSettings(
        s ?? {
          user_id: user.id,
          voice_name: null,
          font_size: 19,
          theme: 'claro',
          word_highlight: true,
          updated_at: new Date().toISOString(),
        }
      );
      setLoading(false);
    }
    load();
    loadVoices().then(setVoices);
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const theme = THEMES[settings?.theme ?? 'claro'];
  const sentences = useMemo(() => {
    if (!book) return [];
    return splitIntoSentences(book.extracted_text[String(page)] ?? '');
  }, [book, page]);

  const voice = useMemo(() => {
    const ptVoices = ptBrVoices(voices);
    if (settings?.voice_name) {
      return ptVoices.find((v) => v.name === settings.voice_name) ?? ptVoices[0] ?? null;
    }
    return ptVoices[0] ?? null;
  }, [voices, settings]);

  const flashToast = useCallback(() => {
    setToast(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(false), 1600);
  }, []);

  const saveProgress = useCallback(
    async (p: number, sIdx: number) => {
      if (!user || !book) return;
      await supabase
        .from('br_reading_progress')
        .upsert({ user_id: user.id, book_id: book.id, current_page: p, position_in_page: sIdx, updated_at: new Date().toISOString() }, { onConflict: 'book_id' });
      flashToast();
    },
    [user, book, flashToast]
  );

  useEffect(() => {
    const narrator = narratorRef.current;
    narrator.setCallbacks({
      onSentence: (i) => setSentIndex(i),
      onWord: (c) => setWordCharIndex(c),
      onDone: () => {
        setPlaying(false);
        setWordCharIndex(null);
        if (book && page < book.total_pages) {
          setPage((p) => p + 1);
          setSentIndex(0);
        }
      },
    });
    return () => narrator.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, page]);

  useEffect(() => {
    narratorRef.current.setSentences(sentences, sentIndex);
    setWordCharIndex(null);
    if (playing) narratorRef.current.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences]);

  useEffect(() => {
    narratorRef.current.setVoice(voice);
  }, [voice]);

  useEffect(() => {
    narratorRef.current.setRate(speed);
  }, [speed]);

  useEffect(() => {
    if (!book) return;
    saveProgress(page, sentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    return () => {
      narratorRef.current.stop();
    };
  }, []);

  const togglePlay = () => {
    if (playing) {
      narratorRef.current.pause();
      setPlaying(false);
      saveProgress(page, sentIndex);
    } else {
      setPlaying(true);
      narratorRef.current.play();
    }
  };

  const goPage = (delta: number) => {
    if (!book) return;
    narratorRef.current.stop();
    setPlaying(false);
    setPage((p) => Math.max(1, Math.min(book.total_pages, p + delta)));
    setSentIndex(0);
  };

  if (loading || !book || !settings) {
    return <div className="center-spinner">Carregando leitor…</div>;
  }

  const pct = book.total_pages ? Math.round((page / book.total_pages) * 100) : 0;

  return (
    <div className="screen" style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', background: theme.bg, color: theme.fg, paddingTop: 14 }}>
      <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto', borderBottom: `1px solid ${theme.border}` }}>
        <RoundIconButton onClick={() => navigate(`/livro/${book.id}`)} style={{ width: 40, height: 40, flex: '0 0 40px', background: theme.chrome, color: theme.fg }}>
          <IconArrowLeft size={19} />
        </RoundIconButton>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
          <div style={{ fontSize: 12.5, color: theme.dim }}>{voice?.name ?? 'Voz padrão do navegador'}</div>
        </div>
        <RoundIconButton onClick={() => navigate('/config')} style={{ width: 40, height: 40, flex: '0 0 40px', background: theme.chrome, color: theme.fg }}>
          <IconSettings size={18} />
        </RoundIconButton>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 26px 26px' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.dim, paddingBottom: 18 }}>
          Página {page}
        </div>
        {sentences.length === 0 ? (
          <div style={{ color: theme.dim, fontSize: 15 }}>Esta página não tem texto extraído.</div>
        ) : (
          <div style={{ lineHeight: 1.72, letterSpacing: '0.005em', fontSize: settings.font_size }}>
            {sentences.map((s, i) => (
              <span
                key={i}
                style={{
                  borderRadius: 7,
                  padding: '2px 1px',
                  transition: 'background-color .18s ease',
                  background: i === sentIndex ? theme.sentBg : 'transparent',
                }}
              >
                {settings.word_highlight && i === sentIndex && wordCharIndex !== null
                  ? renderWithWordHighlight(s, wordCharIndex, theme.wordBg)
                  : s}{' '}
              </span>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 190, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 40 }}>
          <div style={{ animation: 'toastIn .2s ease', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(32,30,29,0.9)', color: '#f5ead8', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 999 }}>
            <IconCheck size={14} color="#a8c07a" strokeWidth={3} />
            Progresso salvo
          </div>
        </div>
      )}

      <div style={{ flex: '0 0 auto', padding: '16px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16, background: theme.chrome, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 999, overflow: 'hidden', background: theme.border }}>
            <div style={{ height: '100%', borderRadius: 999, background: '#c67139', transition: 'width .3s ease', width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.dim, whiteSpace: 'nowrap' }}>
            página {page} de {book.total_pages}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button onClick={() => goPage(-1)} disabled={page <= 1} style={{ width: 50, height: 50, border: 'none', borderRadius: 999, background: 'none', color: theme.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
            <IconChevronsLeft size={24} />
          </button>
          <button
            onClick={togglePlay}
            style={{ width: 74, height: 74, border: 'none', borderRadius: 999, background: '#c67139', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 26px -10px rgba(166,80,30,0.7)' }}
          >
            {playing ? <IconPause size={28} /> : <IconPlay size={30} color="#fff" style={{ marginLeft: 3 }} />}
          </button>
          <button onClick={() => goPage(1)} disabled={page >= book.total_pages} style={{ width: 50, height: 50, border: 'none', borderRadius: 999, background: 'none', color: theme.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= book.total_pages ? 'default' : 'pointer', opacity: page >= book.total_pages ? 0.4 : 1 }}>
            <IconChevronsRight size={24} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, padding: 4, borderRadius: 999, background: theme.border }}>
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              onClick={() => setSpeed(sp)}
              style={{
                border: 'none',
                fontFamily: 'Figtree, sans-serif',
                fontSize: 13.5,
                fontWeight: 700,
                padding: '10px 0',
                borderRadius: 999,
                cursor: 'pointer',
                background: speed === sp ? '#c67139' : 'transparent',
                color: speed === sp ? '#fff' : theme.fg,
              }}
            >
              {sp}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderWithWordHighlight(sentence: string, charIndex: number, wordBg: string) {
  const before = sentence.slice(0, charIndex);
  const wordMatch = sentence.slice(charIndex).match(/^\S+/);
  const word = wordMatch ? wordMatch[0] : '';
  const after = sentence.slice(charIndex + word.length);
  return (
    <>
      {before}
      <span style={{ borderRadius: 5, background: wordBg }}>{word}</span>
      {after}
    </>
  );
}
