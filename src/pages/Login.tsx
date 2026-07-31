import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton, GhostButton, TextField } from '../components/ui';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const action = mode === 'login' ? signIn : signUp;
    const { error } = await action(email, password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    if (mode === 'signup') {
      setInfo('Conta criada! Verifique seu e-mail se for pedida confirmação, ou já pode entrar.');
      setMode('login');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div
      className="screen"
      style={{
        boxSizing: 'border-box',
        background: '#f5ead8',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 26,
        padding: '40px 30px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 260,
          height: 260,
          borderRadius: 999,
          background: 'rgba(122,138,94,0.18)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -120,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: 999,
          background: 'rgba(198,113,57,0.13)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="15" fill="#201e1d" />
            <path
              d="M13 13.5c3.6-1.4 6.4-1.4 9 .4v20.6c-2.6-1.8-5.4-1.8-9-.4V13.5z"
              fill="#f5ead8"
            />
            <rect x="26" y="20" width="3.6" height="8" rx="1.8" fill="#c67139" />
            <rect x="32" y="15.5" width="3.6" height="17" rx="1.8" fill="#c67139" />
            <rect x="38" y="19" width="3.6" height="10" rx="1.8" fill="#7a8a5e" />
          </svg>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 19, letterSpacing: '-0.01em' }}>
            Sk Book Reader
          </div>
        </div>
        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 34, lineHeight: 1.08 }} className="text-wrap-pretty">
          {mode === 'login' ? 'Sua estante que lê pra você.' : 'Crie sua conta em segundos.'}
        </div>
        <div style={{ fontSize: 15.5, lineHeight: 1.5, color: 'rgba(32,30,29,0.6)', maxWidth: 300 }} className="text-wrap-pretty">
          {mode === 'login'
            ? 'Entre para guardar seus livros e retomar a leitura exatamente onde parou.'
            : 'Crie sua conta para começar a importar PDFs e ouvir seus livros.'}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        <TextField
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          required
        />
        <TextField
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />

        {error && <div style={{ color: '#a8542c', fontSize: 13.5 }}>{error}</div>}
        {info && <div style={{ color: '#5f6b48', fontSize: 13.5 }}>{info}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </PrimaryButton>
          <GhostButton
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
              setInfo(null);
            }}
          >
            {mode === 'login' ? 'Criar uma conta' : 'Já tenho uma conta'}
          </GhostButton>
        </div>
      </form>
    </div>
  );
}
