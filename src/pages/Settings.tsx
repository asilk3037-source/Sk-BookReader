import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { loadVoices, ptBrVoices } from '../lib/tts';
import { RoundIconButton, TextButton } from '../components/ui';
import { IconArrowLeft, IconCheck } from '../components/Icon';
import type { ReaderTheme, UserSettings } from '../types';

const THEME_PREVIEW: Record<ReaderTheme, { label: string; bg: string; fg: string }> = {
  claro: { label: 'Claro', bg: '#faf3e6', fg: '#201e1d' },
  sepia: { label: 'Sépia', bg: '#f0e0c0', fg: '#3a2c1c' },
  escuro: { label: 'Escuro', bg: '#1b1917', fg: '#ece2d0' },
};

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      const { data } = await supabase.from('br_user_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (cancelled) return;
      setSettings(
        data ?? {
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
    loadVoices().then((v) => setVoices(ptBrVoices(v)));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = async (patch: Partial<UserSettings>) => {
    if (!settings || !user) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await supabase.from('br_user_settings').upsert({
      user_id: user.id,
      voice_name: next.voice_name,
      font_size: next.font_size,
      theme: next.theme,
      word_highlight: next.word_highlight,
      updated_at: new Date().toISOString(),
    });
  };

  if (loading || !settings) {
    return <div className="center-spinner">Carregando…</div>;
  }

  return (
    <div className="screen" style={{ boxSizing: 'border-box', background: '#f5ead8', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 22 }}>
      <div style={{ padding: '0 24px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <RoundIconButton onClick={() => navigate(-1)}>
          <IconArrowLeft size={20} />
        </RoundIconButton>
        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 24 }}>Configurações</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={sectionLabel}>Voz da narração</div>
          <div style={{ background: '#ebddc5', borderRadius: 22, padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {voices.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 13.5, color: 'rgba(32,30,29,0.55)' }}>
                Nenhuma voz em português encontrada neste navegador.
              </div>
            )}
            {voices.map((v) => {
              const selected = settings.voice_name === v.name || (!settings.voice_name && v === voices[0]);
              return (
                <button
                  key={v.name}
                  onClick={() => persist({ voice_name: v.name })}
                  style={{ border: 'none', background: 'none', textAlign: 'left', padding: '14px 16px', borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(32,30,29,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: '#201e1d' }}>{v.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(32,30,29,0.55)' }}>{v.lang}</div>
                  </div>
                  {selected && <IconCheck size={20} color="#c67139" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={sectionLabel}>Tamanho do texto</div>
          <div style={{ background: '#ebddc5', borderRadius: 22, padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ lineHeight: 1.6, color: '#201e1d', fontSize: settings.font_size }}>
                Ele parou no meio da frase e ouviu o vento.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(32,30,29,0.5)' }}>A</span>
                <input
                  type="range"
                  min={15}
                  max={26}
                  step={1}
                  value={settings.font_size}
                  onChange={(e) => persist({ font_size: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#c67139', height: 22, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 21, fontWeight: 700, color: 'rgba(32,30,29,0.5)' }}>A</span>
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={sectionLabel}>Tema de leitura</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {(Object.keys(THEME_PREVIEW) as ReaderTheme[]).map((key) => {
              const th = THEME_PREVIEW[key];
              const selected = settings.theme === key;
              return (
                <button
                  key={key}
                  onClick={() => persist({ theme: key })}
                  style={{
                    cursor: 'pointer',
                    padding: '14px 10px',
                    borderRadius: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    background: selected ? 'rgba(198,113,57,0.14)' : 'transparent',
                    border: selected ? '1.5px solid #c67139' : '1.5px solid transparent',
                  }}
                >
                  <div style={{ width: '100%', height: 44, borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: '0 9px', background: th.bg }}>
                    <div style={{ height: 4, borderRadius: 999, width: '100%', background: th.fg, opacity: 0.75 }} />
                    <div style={{ height: 4, borderRadius: 999, width: '62%', background: '#c67139' }} />
                    <div style={{ height: 4, borderRadius: 999, width: '85%', background: th.fg, opacity: 0.35 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#201e1d' }}>{th.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={sectionLabel}>Leitura</div>
          <div style={{ background: '#ebddc5', borderRadius: 22, padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              onClick={() => persist({ word_highlight: !settings.word_highlight })}
              style={{ border: 'none', background: 'none', textAlign: 'left', padding: '15px 16px', borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: '#201e1d' }}>Destaque palavra por palavra</div>
                <div style={{ fontSize: 13, color: 'rgba(32,30,29,0.55)' }} className="text-wrap-pretty">
                  Acompanha a narração em tempo real
                </div>
              </div>
              <div
                style={{
                  width: 50,
                  height: 30,
                  flex: '0 0 50px',
                  borderRadius: 999,
                  padding: 3,
                  display: 'flex',
                  transition: 'background-color .18s ease',
                  background: settings.word_highlight ? '#c67139' : 'rgba(32,30,29,0.18)',
                  justifyContent: settings.word_highlight ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 999, background: '#fff', boxShadow: '0 2px 4px rgba(32,30,29,0.25)' }} />
              </div>
            </button>
            <div style={{ padding: '15px 16px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: '#201e1d' }}>Salvar progresso automaticamente</div>
                <div style={{ fontSize: 13, color: 'rgba(32,30,29,0.55)' }}>A cada trecho lido</div>
              </div>
              <div style={{ width: 50, height: 30, flex: '0 0 50px', borderRadius: 999, padding: 3, display: 'flex', justifyContent: 'flex-end', background: '#c67139' }}>
                <div style={{ width: 24, height: 24, borderRadius: 999, background: '#fff', boxShadow: '0 2px 4px rgba(32,30,29,0.25)' }} />
              </div>
            </div>
          </div>
        </section>

        <TextButton
          onClick={async () => {
            await signOut();
            navigate('/login', { replace: true });
          }}
          style={{ alignSelf: 'center' }}
        >
          Sair da conta
        </TextButton>
      </div>
    </div>
  );
}

const sectionLabel: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(32,30,29,0.45)',
  paddingLeft: 6,
};
