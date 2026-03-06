import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = register(name, email, password);
        if (success) {
            navigate('/profile');
        } else {
            setError('Пользователь с таким email уже существует');
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
                <ShieldAlert size={48} color="var(--color-coral)" style={{ marginBottom: '20px' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Новый аккаунт</h2>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label className="input-label">ФИО</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Иванов Иван"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                        Далее <ArrowRight size={20} />
                    </button>
                </form>

                <p style={{ marginTop: '20px', color: 'var(--color-text-muted)' }}>
                    Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--color-teal)' }}>Войти</Link>
                </p>
            </div>
        </div>
    );
}
