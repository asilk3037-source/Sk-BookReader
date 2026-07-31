import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RoundIconButton, PrimaryButton, TextButton, ProgressBar } from '../components/ui';
import { IconArrowLeft, IconPlay, IconClock } from '../components/Icon';
import type { Book, ReadingProgress } from '../types';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      const [{ data: b }, { data: p }] = await Promise.all([
        supabase.from('br_books').select('*').eq('id', id).single(),
        supabase.from('br_reading_progress').select('*').eq('book_id', id).maybeSingle(),
      ]);
      if (cancelled) return;
      setBook(b);
      setProgress(p);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const doDelete = async () => {
    if (!book) return;
    setDeleting(true);
    await supabase.storage.from('book-files').remove([book.file_path]);
    await supabase.from('br_books').delete().eq('id', book.id);
    setDeleting(false);
    navigate('/', { replace: true });
  };

  if (loading || !book) {
    return <div className="center-spinner">Carregando…</div>;
  }

  const currentPage = progress?.current_page ?? 0;
  const pct = book.total_pages ? Math.round((currentPage / book.total_pages) * 100) : 0;
  const started = currentPage > 0;

  return (
    <div className="screen" style={{ boxSizing: 'border-box', background: '#f5ead8', display: 'flex', flexDirection: 'column', paddingTop: 22 }}>
      <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <RoundIconButton onClick={() => navigate('/')}>
          <IconArrowLeft size={20} />
        </RoundIconButton>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(32,30,29,0.5)' }}>
          {book.total_pages} páginas
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 30px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            width: 170,
            height: 240,
            borderRadius: '6px 12px 12px 6px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 26px 44px -22px rgba(32,30,29,0.85), inset 6px 0 0 rgba(0,0,0,0.16)',
            background: book.cover_color,
          }}
        >
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, lineHeight: 1.12, color: 'rgba(255,255,255,0.96)' }} className="text-wrap-pretty">
            {book.title}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>
            {book.author ?? 'Autor desconhecido'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 26, lineHeight: 1.15, textAlign: 'center' }} className="text-wrap-pretty">
            {book.title}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(32,30,29,0.6)' }}>{book.author ?? 'Autor desconhecido'}</div>
        </div>

        <div style={{ width: '100%', background: '#ebddc5', borderRadius: 24, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, lineHeight: 1.45 }} className="text-wrap-pretty">
            {started
              ? `Você parou na página ${currentPage} de ${book.total_pages} — ${pct}%`
              : 'Você ainda não começou este livro.'}
          </div>
          <ProgressBar pct={pct} height={9} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(32,30,29,0.55)', fontSize: 13.5 }}>
            <IconClock size={15} />
            {book.total_pages - currentPage} páginas restantes
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PrimaryButton onClick={() => navigate(`/leitor/${book.id}`)}>
          <IconPlay size={18} color="#fff" />
          {started ? 'Continuar leitura' : 'Começar a ler'}
        </PrimaryButton>
        <TextButton onClick={() => setConfirmDelete(true)}>Excluir livro</TextButton>
      </div>

      {confirmDelete && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(32,30,29,0.5)', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
          <div style={{ width: '100%', background: '#f5ead8', borderRadius: 28, padding: '26px 24px 22px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 24px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, lineHeight: 1.15 }} className="text-wrap-pretty">
              Excluir este livro?
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(32,30,29,0.62)' }} className="text-wrap-pretty">
              O PDF e o seu progresso de leitura serão apagados. Isso não pode ser desfeito.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 6 }}>
              <button
                onClick={doDelete}
                disabled={deleting}
                style={{ border: 'none', background: '#a8542c', color: '#fff', fontFamily: 'Figtree, sans-serif', fontSize: 16, fontWeight: 700, padding: 16, borderRadius: 999, cursor: 'pointer' }}
              >
                {deleting ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ border: '1.5px solid rgba(32,30,29,0.16)', background: 'none', color: '#201e1d', fontFamily: 'Figtree, sans-serif', fontSize: 16, fontWeight: 600, padding: 15, borderRadius: 999, cursor: 'pointer' }}
              >
                Manter na estante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
