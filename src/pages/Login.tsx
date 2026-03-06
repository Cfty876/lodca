import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(email, password);
        if (success) {
            navigate('/profile');
        } else {
            setError('Неверный email или пароль');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url(/bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(1, 10, 21, 0.8)',
                zIndex: 1
            }}></div>

            <div className="glass-panel" style={{
                position: 'relative',
                zIndex: 10,
                padding: '50px',
                width: '100%',
                maxWidth: '450px',
                textAlign: 'center'
            }}>
                <Shield size={48} color="var(--color-teal)" style={{ marginBottom: '20px' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Вход в Водяной</h2>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="example@reserve.ru"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Пароль</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'var(--color-coral)', marginTop: '10px' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                        Войти <ArrowRight size={20} />
                    </button>
                </form>

                <p style={{ marginTop: '20px', color: 'var(--color-text-muted)' }}>
                    Нет аккаунта? <Link to="/register" style={{ color: 'var(--color-teal)' }}>Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}
