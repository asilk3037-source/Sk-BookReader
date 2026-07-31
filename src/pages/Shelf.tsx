import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RoundIconButton } from '../components/ui';
import { IconSettings, IconPlay, IconPlus } from '../components/Icon';
import type { BookWithProgress } from '../types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(email: string | undefined) {
  if (!email) return '';
  const local = email.split('@')[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function Shelf() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      const [{ data: bookRows }, { data: progressRows }] = await Promise.all([
        supabase.from('br_books').select('*').order('created_at', { ascending: false }),
        supabase.from('br_reading_progress').select('*'),
      ]);
      if (cancelled) return;
      const progressByBook = new Map((progressRows ?? []).map((p) => [p.book_id, p]));
      const merged: BookWithProgress[] = (bookRows ?? []).map((b) => ({
        ...b,
        progress: progressByBook.get(b.id) ?? null,
      }));
      setBooks(merged);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const current = useMemo(() => {
    const inProgress = books.filter((b) => b.progress && b.progress.current_page > 0);
    inProgress.sort(
      (a, b) => new Date(b.progress!.updated_at).getTime() - new Date(a.progress!.updated_at).getTime()
    );
    return inProgress[0] ?? null;
  }, [books]);

  const rows = useMemo(() => {
    const out: BookWithProgress[][] = [];
    for (let i = 0; i < books.length; i += 2) out.push(books.slice(i, i + 2));
    return out;
  }, [books]);

  if (loading) {
    return <div className="center-spinner">Carregando sua estante…</div>;
  }

  return (
    <div
      className="screen"
      style={{ boxSizing: 'border-box', background: '#f5ead8', display: 'flex', flexDirection: 'column', paddingTop: 22 }}
    >
      <div style={{ padding: '0 24px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(32,30,29,0.5)', letterSpacing: '0.02em' }}>
            {greeting()}{firstName(user?.email) ? `, ${firstName(user?.email)}` : ''}
          </div>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 27, lineHeight: 1.15, maxWidth: 250 }} className="text-wrap-pretty">
            Vamos continuar de onde você parou.
          </div>
        </div>
        <RoundIconButton onClick={() => navigate('/config')} style={{ width: 44, height: 44, flex: '0 0 44px', marginTop: 4 }}>
          <IconSettings size={21} />
        </RoundIconButton>
      </div>

      {books.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30, padding: '0 28px 90px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end', padding: '0 8px' }}>
              <div style={{ height: 96, borderRadius: '5px 9px 9px 5px', border: '2px dashed rgba(32,30,29,0.2)', background: 'rgba(32,30,29,0.03)' }} />
              <div
                style={{
                  height: 128,
                  borderRadius: '5px 9px 9px 5px',
                  border: '2px dashed rgba(198,113,57,0.45)',
                  background: 'rgba(198,113,57,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPlus size={26} color="#c67139" />
              </div>
              <div style={{ height: 82, borderRadius: '5px 9px 9px 5px', border: '2px dashed rgba(32,30,29,0.2)', background: 'rgba(32,30,29,0.03)' }} />
            </div>
            <div style={{ height: 9, borderRadius: 999, background: '#dcc79f', boxShadow: '0 8px 14px -8px rgba(32,30,29,0.5)', marginTop: 14 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 26, lineHeight: 1.15 }} className="text-wrap-pretty">
              Sua estante está esperando o primeiro livro.
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(32,30,29,0.6)' }} className="text-wrap-pretty">
              Traga um PDF — um romance, uma apostila, aquele relatório enorme — e a gente lê em voz alta pra você.
            </div>
          </div>
          <button
            onClick={() => navigate('/adicionar')}
            style={{
              border: 'none',
              background: '#c67139',
              color: '#fff',
              fontFamily: 'Figtree, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              padding: '17px 24px',
              borderRadius: 999,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <IconPlus size={19} />
            Adicionar meu primeiro livro
          </button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 0 130px' }}>
            {current && (
              <div style={{ padding: '6px 24px 22px' }}>
                <button
                  onClick={() => navigate(`/leitor/${current.id}`)}
                  style={{
                    width: '100%',
                    border: 'none',
                    textAlign: 'left',
                    background: '#201e1d',
                    color: '#f5ead8',
                    borderRadius: 22,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    boxShadow: '0 12px 26px -14px rgba(32,30,29,0.7)',
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 62,
                      flex: '0 0 46px',
                      borderRadius: 6,
                      background: current.cover_color,
                      boxShadow: 'inset 3px 0 0 rgba(0,0,0,0.18)',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(245,234,216,0.55)' }}>
                      Continuar ouvindo
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {current.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(245,234,216,0.6)' }}>
                      Página {current.progress?.current_page ?? 0} de {current.total_pages}
                    </div>
                  </div>
                  <div style={{ width: 46, height: 46, flex: '0 0 46px', borderRadius: 999, background: '#c67139', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconPlay size={19} color="#201e1d" style={{ marginLeft: 2 }} />
                  </div>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 24px 10px' }}>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 19 }}>Minha estante</div>
              <div style={{ fontSize: 13, color: 'rgba(32,30,29,0.5)' }}>
                {books.length} {books.length === 1 ? 'livro' : 'livros'}
              </div>
            </div>

            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', flexDirection: 'column', padding: '0 20px 26px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end', padding: '0 4px' }}>
                  {row.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => navigate(`/livro/${b.id}`)}
                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left' }}
                    >
                      <div
                        style={{
                          height: 158,
                          borderRadius: '5px 9px 9px 5px',
                          padding: '14px 13px 13px 17px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 10px 18px -12px rgba(32,30,29,0.8), inset 4px 0 0 rgba(0,0,0,0.16)',
                          background: b.cover_color,
                        }}
                      >
                        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 15, lineHeight: 1.15, color: 'rgba(255,255,255,0.96)' }} className="text-wrap-pretty">
                          {b.title}
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>
                          {b.author ?? 'Autor desconhecido'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ height: 9, borderRadius: 999, background: '#dcc79f', boxShadow: '0 8px 14px -8px rgba(32,30,29,0.5)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 4px 0' }}>
                  {row.map((b) => {
                    const pct = b.total_pages ? Math.round(((b.progress?.current_page ?? 0) / b.total_pages) * 100) : 0;
                    return (
                      <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }} className="text-wrap-pretty">
                          {b.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(32,30,29,0.12)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 999, background: '#c67139', width: `${pct}%` }} />
                          </div>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(32,30,29,0.5)' }}>{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/adicionar')}
            style={{
              position: 'absolute',
              right: 22,
              bottom: 26,
              cursor: 'pointer',
              width: 62,
              height: 62,
              border: 'none',
              borderRadius: 999,
              background: '#c67139',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 14px 28px -10px rgba(166,80,30,0.75)',
            }}
          >
            <IconPlus size={27} />
          </button>
        </>
      )}
    </div>
  );
}
