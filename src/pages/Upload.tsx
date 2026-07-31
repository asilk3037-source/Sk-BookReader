import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RoundIconButton, PrimaryButton, TextField } from '../components/ui';
import { IconArrowLeft, IconUpload, IconFile, IconCheck } from '../components/Icon';

type Stage = 'idle' | 'uploading' | 'processing' | 'meta';

const SWATCHES = ['#c67139', '#7a8a5e', '#a8542c', '#4b5f57', '#8a6a3f'];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [procLabel, setProcLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [filePath, setFilePath] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<{ totalPages: number; pages: Record<string, string> } | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [saving, setSaving] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (f.type !== 'application/pdf') {
      setError('Escolha um arquivo PDF.');
      return;
    }
    setError(null);
    setFile(f);
    setTitle(f.name.replace(/\.pdf$/i, ''));
    setStage('uploading');
    setUploadPct(0);

    const path = `${user.id}/${Date.now()}-${f.name}`;

    const fakeProgress = window.setInterval(() => {
      setUploadPct((p) => (p < 88 ? p + 6 : p));
    }, 130);

    try {
      const { error: upErr } = await supabase.storage.from('book-files').upload(path, f, {
        contentType: 'application/pdf',
        upsert: false,
      });
      window.clearInterval(fakeProgress);
      if (upErr) throw upErr;
      setUploadPct(100);
      setFilePath(path);

      setStage('processing');
      setProcLabel('Preparando…');
      const { extractPdfText } = await import('../lib/pdf');
      const result = await extractPdfText(f, (page, total) => {
        setProcLabel(`Página ${page} de ${total}`);
      });
      setExtracted(result);
      setStage('meta');
    } catch (err) {
      window.clearInterval(fakeProgress);
      setError(err instanceof Error ? err.message : 'Não foi possível processar o PDF.');
      setStage('idle');
    }
  };

  const saveBook = async () => {
    if (!user || !filePath || !extracted) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('br_books')
      .insert({
        user_id: user.id,
        title: title.trim() || 'Livro sem título',
        author: author.trim() || null,
        file_path: filePath,
        cover_color: color,
        total_pages: extracted.totalPages,
        extracted_text: extracted.pages,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate(`/livro/${data.id}`, { replace: true });
  };

  return (
    <div className="screen" style={{ boxSizing: 'border-box', background: '#f5ead8', display: 'flex', flexDirection: 'column', padding: '22px 24px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 26 }}>
        <RoundIconButton onClick={() => navigate(-1)}>
          <IconArrowLeft size={20} />
        </RoundIconButton>
        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22 }}>Adicionar livro</div>
      </div>

      <input ref={inputRef} type="file" accept="application/pdf" onChange={onFileChosen} style={{ display: 'none' }} />

      {error && (
        <div style={{ background: 'rgba(198,113,57,0.12)', color: '#a8542c', borderRadius: 14, padding: '12px 16px', fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {stage === 'idle' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <button
            onClick={pickFile}
            style={{
              border: '2.5px dashed rgba(198,113,57,0.5)',
              background: 'rgba(198,113,57,0.07)',
              borderRadius: 26,
              padding: '48px 26px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 66, height: 66, borderRadius: 999, background: '#c67139', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUpload size={28} color="#fff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 20 }}>Solte seu PDF aqui</div>
              <div style={{ fontSize: 14, color: 'rgba(32,30,29,0.55)', textAlign: 'center' }}>
                ou toque para escolher um arquivo do seu aparelho
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(32,30,29,0.4)' }}>PDF · ATÉ 80 MB</div>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#ebddc5', borderRadius: 22, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(32,30,29,0.5)' }}>
              Como funciona
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'rgba(32,30,29,0.75)' }} className="text-wrap-pretty">
              Lemos o texto de cada página do seu PDF e guardamos tudo pronto. Da próxima vez, o livro abre na hora — sem
              processar de novo.
            </div>
          </div>
        </div>
      )}

      {stage === 'uploading' && file && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26, paddingBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 60, flex: '0 0 46px', borderRadius: 6, background: '#ebddc5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a8542c' }}>PDF</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(32,30,29,0.55)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB · enviando</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 10, borderRadius: 999, background: 'rgba(32,30,29,0.12)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: '#c67139', transition: 'width .25s ease', width: `${uploadPct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(32,30,29,0.55)' }}>
              <span>Enviando para sua estante</span>
              <span style={{ fontWeight: 700, color: '#201e1d' }}>{uploadPct}%</span>
            </div>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, paddingBottom: 80 }}>
          <div style={{ width: 92, height: 92, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '5px solid rgba(32,30,29,0.1)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '5px solid transparent', borderTopColor: '#c67139', animation: 'spin 1s linear infinite' }} />
            <IconFile size={30} color="#201e1d" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 23 }}>Extraindo texto, aguarde…</div>
            <div style={{ fontSize: 14.5, color: 'rgba(32,30,29,0.55)', textAlign: 'center' }}>{procLabel}</div>
          </div>
        </div>
      )}

      {stage === 'meta' && extracted && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(122,138,94,0.16)', borderRadius: 22, padding: 16 }}>
            <IconCheck size={22} color="#5f6b48" style={{ flex: '0 0 22px' }} />
            <div style={{ fontSize: 14.5, lineHeight: 1.45, color: '#3f4a30' }} className="text-wrap-pretty">
              Texto extraído: <strong>{extracted.totalPages} páginas</strong>. Confira os dados antes de guardar.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 88,
                height: 118,
                flex: '0 0 88px',
                borderRadius: '5px 9px 9px 5px',
                padding: '12px 10px',
                display: 'flex',
                alignItems: 'flex-end',
                boxShadow: 'inset 4px 0 0 rgba(0,0,0,0.16)',
                background: color,
              }}
            >
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 12, lineHeight: 1.15, color: 'rgba(255,255,255,0.95)' }}>{title}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(32,30,29,0.5)' }}>
                Cor da capa
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SWATCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setColor(s)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      cursor: 'pointer',
                      background: s,
                      border: color === s ? '2.5px solid #201e1d' : '2.5px solid transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Opcional" />
          <div style={{ flex: 1 }} />
          <PrimaryButton onClick={saveBook} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar na estante'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
