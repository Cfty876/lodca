import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, Play, User as UserIcon, Copy, CheckCircle2 } from 'lucide-react';

export default function Profile() {
    const { user, generatePlatformKey, logout } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) return null;

    const handleCopy = () => {
        if (user.platformKey) {
            navigator.clipboard.writeText(user.platformKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGoToMap = () => {
        navigate('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-deep-ocean)',
            position: 'relative'
        }}>
            <div className="bubbles" id="bubbles-profile"></div>

            <div className="glass-panel" style={{
                padding: '50px',
                width: '100%',
                maxWidth: '600px',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: 'rgba(0, 230, 246, 0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <UserIcon size={30} color="var(--color-teal)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.8rem' }}>{user.name}</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={logout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        Выйти
                    </button>
                </div>

                <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Key size={24} color="var(--color-coral)" /> Ключ доступа к платформе
                    </h3>

                    {!user.platformKey ? (
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                                Для доступа к основной платформе мониторинга и управлению дронами, вам необходимо сгенерировать уникальный ключ.
                            </p>
                            <button onClick={generatePlatformKey} className="btn-primary">
                                Сгенерировать ключ
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{
                                background: 'rgba(1, 10, 21, 0.8)',
                                padding: '16px', borderRadius: '8px',
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', border: '1px solid var(--color-teal)',
                                boxShadow: 'var(--neon-glow-teal)',
                                marginBottom: '20px'
                            }}>
                                <code style={{ fontSize: '1.2rem', color: '#fff', letterSpacing: '2px' }}>
                                    {user.platformKey}
                                </code>
                                <button onClick={handleCopy} style={{
                                    background: 'none', border: 'none', color: 'var(--color-teal)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    {copied ? <CheckCircle2 size={24} color="#00ff00" /> : <Copy size={24} />}
                                </button>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Сохраните этот ключ. Он будет использоваться для подключения дронов к системе.
                            </p>
                        </div>
                    )}
                </div>

                {user.platformKey && (
                    <button onClick={handleGoToMap} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        <Play size={20} fill="currentColor" /> Запустить платформу мониторинга
                    </button>
                )}
            </div>
        </div>
    );
}
