import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Droplets, Shield, Map } from 'lucide-react';

export default function Landing() {
    // Bubbles effect
    useEffect(() => {
        const bubblesContainer = document.getElementById('bubbles');
        if (bubblesContainer) {
            for (let i = 0; i < 20; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                const size = Math.random() * 60 + 10;
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${Math.random() * 100}%`;
                bubble.style.animationDuration = `${Math.random() * 5 + 5}s`;
                bubble.style.animationDelay = `${Math.random() * 5}s`;
                bubblesContainer.appendChild(bubble);
            }
        }
        return () => {
            if (bubblesContainer) bubblesContainer.innerHTML = '';
        };
    }, []);

    return (
        <div className="landing-page" style={{
            backgroundImage: 'url(/bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh',
            position: 'relative'
        }}>
            <div id="bubbles" className="bubbles"></div>

            {/* Overlay to ensure readability */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(1, 10, 21, 0.7)',
                zIndex: 1
            }}></div>

            <nav style={{
                position: 'relative',
                zIndex: 10,
                padding: '24px 48px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Droplets size={32} color="var(--color-teal)" />
                    <h1 style={{ fontSize: '2rem', letterSpacing: '2px', color: '#fff' }}>ВОДЯНОЙ</h1>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Link to="/login" className="btn-secondary">Вход</Link>
                    <Link to="/register" className="btn-primary">Регистрация</Link>
                </div>
            </nav>

            <main style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '80px 24px',
                textAlign: 'center'
            }}>
                <div className="glass-panel" style={{
                    padding: '60px',
                    maxWidth: '800px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Images inside the hero panel */}
                    <img src="/coral.png" alt="Coral" className="animate-float" style={{
                        position: 'absolute',
                        bottom: '-50px',
                        left: '-50px',
                        width: '200px',
                        opacity: 0.8,
                        zIndex: 0
                    }} />
                    <img src="/drone.png" alt="Drone" className="animate-float" style={{
                        position: 'absolute',
                        top: '-30px',
                        right: '-30px',
                        width: '250px',
                        animationDelay: '1s',
                        zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '3.5rem', marginBottom: '20px', color: '#fff', textShadow: 'var(--neon-glow-teal)' }}>
                            Исследуйте глубины заповедников
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-main)', marginBottom: '40px', lineHeight: '1.6' }}>
                            Инновационная платформа мониторинга подводного мира. Управляйте дронами, исследуйте водные ресурсы и собирайте данные на интерактивной карте России.
                        </p>
                        <Link to="/register" className="btn-primary" style={{ fontSize: '1.2rem', padding: '16px 36px' }}>
                            Начать погружение <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>

                <section style={{
                    display: 'flex',
                    gap: '30px',
                    marginTop: '80px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <div className="glass-card" style={{ padding: '30px', width: '300px', textAlign: 'left' }}>
                        <Shield size={40} color="var(--color-teal)" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Безопасный доступ</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>Получите уникальный ключ платформы для защищенного доступа к управлению дронами.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '30px', width: '300px', textAlign: 'left' }}>
                        <Map size={40} color="var(--color-teal)" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Интерактивная карта</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>Рисуйте маршруты, отмечайте точки сбора воды и наблюдайте за автоматическим патрулированием.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '30px', width: '300px', textAlign: 'left' }}>
                        <Droplets size={40} color="var(--color-teal)" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Мониторинг воды</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>Получайте аналитику и данные о состоянии водоемов в заповедниках России в реальном времени.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
