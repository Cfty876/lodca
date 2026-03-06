import { useState, useRef, useEffect, useMemo } from 'react';
import { YMaps, Map, Placemark, Polyline, Polygon, ZoomControl } from '@pbe/react-yandex-maps';
import { Navigation, Droplets, Battery, Activity, Search, ShieldCheck, SquareDashed, Waves, Trees, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NATURE_RESERVES, type ReserveData } from '../data/NatureReserves';

// Helper for point-in-polygon check
function isPointInPolygon(point: number[], polygon: number[][]) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

interface DroneTelemetry {
    depth: number;
    temperature: number;
    pressure: number;
    speed: number;
    pitch: number;
    roll: number;
    heading: number;
    voltage: number;
    current: number;
    satellites: number;
    rssi: number;
}

interface Drone {
    id: string;
    name: string;
    battery: number;
    status: 'idle' | 'patrolling' | 'charging' | 'rtl' | 'landing';
    waterSamples: number;
    telemetry: DroneTelemetry;
    history: { time: string; depth: number; temp: number }[];
}

interface DroneLog {
    id: string;
    time: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'critical';
}

function PFD({ pitch, roll, heading }: { pitch: number; roll: number; heading: number }) {
    return (
        <div className="pfd-container">
            <div className="pfd-horizon" style={{ transform: `rotate(${roll}deg) translateY(${pitch * 2}px)` }}>
                <div className="pfd-sky"></div>
                <div className="pfd-ground"></div>
            </div>
            <div className="pfd-overlay">
                <div className="pfd-crosshair"></div>
                <div className="pfd-heading">{Math.round(heading)}°</div>
            </div>
        </div>
    );
}

function TelemetryChart({ data, color }: { data: { depth: number; temp: number }[], color: string }) {
    if (data.length < 2) return <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>OЖИДАНИЕ ДАННЫХ...</div>;

    const max = Math.max(...data.map(d => d.depth), 10);
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.depth / max) * 100}`).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '60px', overflow: 'visible' }}>
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} style={{ transition: 'all 0.5s ease' }} />
            <path d={`M ${points} L 100,100 L 0,100 Z`} fill={color} fillOpacity="0.1" />
        </svg>
    );
}

function CameraFeed({ activeDrone }: { activeDrone: Drone | undefined }) {
    return (
        <div className="camera-container">
            <div className="camera-scanlines"></div>
            <div className="camera-static"></div>

            {/* Mock Video Stream */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-teal)', fontSize: '0.6rem', letterSpacing: '2px', opacity: 0.5 }}>- NO SIGNAL -</p>
            </div>

            <div className="osd-overlay">
                <div className="osd-corner osd-top-left"></div>
                <div className="osd-corner osd-top-right"></div>
                <div className="osd-corner osd-bottom-left"></div>
                <div className="osd-corner osd-bottom-right"></div>

                <div className="osd-rec">
                    <div className="rec-dot"></div>
                    <div>REC</div>
                </div>

                {activeDrone && (
                    <>
                        <div style={{ position: 'absolute', top: '30px', right: '70px', textAlign: 'right', fontSize: '0.8rem' }}>
                            {new Date().toLocaleTimeString()} UTC<br />
                            DRONE: {activeDrone.name}<br />
                            MODE: {activeDrone.status.toUpperCase()}
                        </div>

                        <div style={{ position: 'absolute', bottom: '60px', left: '70px', fontSize: '0.8rem' }}>
                            LAT: {activeDrone.status === 'patrolling' ? (activeDrone.telemetry.pitch * 0.0001 + 61.524).toFixed(6) : '61.524000'}<br />
                            LON: {activeDrone.status === 'patrolling' ? (activeDrone.telemetry.roll * 0.0001 + 105.318).toFixed(6) : '105.318000'}<br />
                            SPD: {activeDrone.telemetry.speed.toFixed(2)} m/s
                        </div>

                        <div style={{ position: 'absolute', bottom: '60px', right: '70px', textAlign: 'right', fontSize: '0.8rem' }}>
                            BATT: {activeDrone.battery}%<br />
                            VOLT: {activeDrone.telemetry.voltage.toFixed(2)} V<br />
                            AMPS: {activeDrone.telemetry.current.toFixed(1)} A
                        </div>

                        {/* Heading Tape Mock */}
                        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', borderBottom: '1px solid var(--color-teal)', width: '200px', textAlign: 'center' }}>
                            {Math.round(activeDrone.telemetry.heading)}°
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();

    const [drones, setDrones] = useState<Drone[]>([
        {
            id: 'dr-1',
            name: 'Водяной X-1',
            battery: 85,
            status: 'idle',
            waterSamples: 0,
            telemetry: {
                depth: 0, temperature: 14.2, pressure: 1.0, speed: 0,
                pitch: 0, roll: 0, heading: 0,
                voltage: 12.6, current: 0.5, satellites: 12, rssi: -65
            },
            history: []
        },
        {
            id: 'dr-2',
            name: 'Водяной X-2',
            battery: 92,
            status: 'idle',
            waterSamples: 0,
            telemetry: {
                depth: 0, temperature: 13.8, pressure: 1.0, speed: 0,
                pitch: 0, roll: 0, heading: 90,
                voltage: 12.4, current: 0.4, satellites: 0, rssi: -100
            },
            history: []
        }
    ]);

    const [logs, setLogs] = useState<DroneLog[]>([
        { id: '1', time: new Date().toLocaleTimeString(), message: 'Инициализация системы', type: 'info' }
    ]);

    const [selectedDrone, setSelectedDrone] = useState<string>('dr-1');
    const [waypoints, setWaypoints] = useState<number[][]>(() => {
        const saved = localStorage.getItem('vodyanoy_waypoints');
        return saved ? JSON.parse(saved) : [];
    });
    const [reserves, setReserves] = useState<number[][][]>(() => {
        const saved = localStorage.getItem('vodyanoy_reserves');
        return saved ? JSON.parse(saved) : [];
    });
    const [waterBodies, setWaterBodies] = useState<number[][][]>(() => {
        const saved = localStorage.getItem('vodyanoy_waterbodies');
        return saved ? JSON.parse(saved) : [];
    });
    const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
    const [drawMode, setDrawMode] = useState<'route' | 'reserve' | 'water'>('route');
    const [currentPos, setCurrentPos] = useState<number[] | null>(null);
    const [isPatrolling, setIsPatrolling] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);

    // Save state to localStorage
    useEffect(() => {
        localStorage.setItem('vodyanoy_waypoints', JSON.stringify(waypoints));
    }, [waypoints]);

    useEffect(() => {
        localStorage.setItem('vodyanoy_reserves', JSON.stringify(reserves));
    }, [reserves]);

    useEffect(() => {
        localStorage.setItem('vodyanoy_waterbodies', JSON.stringify(waterBodies));
    }, [waterBodies]);

    const suggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return NATURE_RESERVES.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [searchQuery]);

    // Ref to the Yandex Map instance to call setCenter based on search etc
    const mapRef = useRef<any>(null);

    // Russia center coordinates
    const MAP_CENTER = [61.524, 105.318];

    const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'critical' = 'info') => {
        setLogs(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 10));
    };

    const handleMapClick = (e: any) => {
        if (!isPatrolling) {
            const coords = e.get('coords');
            if (drawMode === 'route') {
                // Check if point is in any water body
                const isInWater = waterBodies.some(poly => isPointInPolygon(coords, poly));

                if (waterBodies.length > 0 && !isInWater) {
                    addLog('Ошибка: Точка должна быть на водном объекте', 'warning');
                    return;
                }

                setWaypoints((prev) => [...prev, coords]);
                if (!currentPos && waypoints.length === 0) {
                    setCurrentPos(coords);
                }
                addLog(`Точка добавлена [${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}]`, 'info');
            } else {
                setCurrentPolygon((prev) => [...prev, coords]);
                addLog(`Точка границы добавлена`, 'info');
            }
        }
    };

    const removeWaypoint = (index: number) => {
        if (isPatrolling) return;
        setWaypoints(prev => prev.filter((_, i) => i !== index));
        addLog(`Точка маршрута ${index + 1} удалена`, 'info');
    };

    const finishPolygon = () => {
        if (currentPolygon.length < 3) {
            addLog('Для создания области нужно минимум 3 точки', 'warning');
            return;
        }

        if (drawMode === 'reserve') {
            setReserves(prev => [...prev, currentPolygon]);
            addLog('Территория заповедника сохранена', 'success');
        } else if (drawMode === 'water') {
            setWaterBodies(prev => [...prev, currentPolygon]);
            addLog('Водный объект сохранен', 'success');
        }
        setCurrentPolygon([]);
    };

    const handleRTL = () => {
        if (!isPatrolling) return;
        addLog('Команда RTL (Возврат на базу) принята', 'warning');
        setDrones(prev => prev.map(d => d.id === selectedDrone ? { ...d, status: 'rtl' } : d));
        // Simplified: just jump to start or stop
    };

    const handleLand = () => {
        if (!isPatrolling) return;
        addLog('Команда LAND (Посадка) принята', 'critical');
        setDrones(prev => prev.map(d => d.id === selectedDrone ? { ...d, status: 'landing' } : d));
    };

    const handleLaunch = () => {
        if (waypoints.length > 1) {
            setIsPatrolling(true);
            addLog(`Миссия запущена. Точек: ${waypoints.length}`, 'success');

            setDrones(prev => prev.map(d =>
                d.id === selectedDrone ? {
                    ...d,
                    status: 'patrolling',
                    telemetry: { ...d.telemetry, speed: 5.2, depth: 2.5, pitch: 5, roll: 2 }
                } : d
            ));

            let index = 0;
            const timer = setInterval(() => {
                if (index < waypoints.length - 1) {
                    index++;
                    setCurrentPos(waypoints[index]);
                    setDrones(prev => prev.map(d => {
                        if (d.id === selectedDrone) {
                            if (d.status === 'rtl' || d.status === 'landing') {
                                clearInterval(timer);
                                setTimeout(() => {
                                    setIsPatrolling(false);
                                    setWaypoints([]);
                                    setDrones(p => p.map(dr => dr.id === selectedDrone ? { ...dr, status: 'idle', telemetry: { ...dr.telemetry, speed: 0, pitch: 0, roll: 0 } } : dr));
                                    addLog(d.status === 'rtl' ? 'Дрон вернулся на базу' : 'Посадка завершена', 'success');
                                }, 100);
                                return d;
                            }

                            const newDepth = 2.5 + (Math.random() * 5);
                            const newTemp = 14.2 - (Math.random() * 2);
                            const newHistory = [...(d.history || []), { time: new Date().toLocaleTimeString(), depth: newDepth, temp: newTemp }].slice(-20);

                            return {
                                ...d,
                                waterSamples: d.waterSamples + Math.floor(Math.random() * 3) + 1,
                                battery: Math.max(0, d.battery - 0.5),
                                telemetry: {
                                    ...d.telemetry,
                                    depth: newDepth,
                                    temperature: newTemp,
                                    pressure: 1.2 + (Math.random() * 0.5),
                                    pitch: (Math.random() * 10) - 5,
                                    roll: (Math.random() * 8) - 4,
                                    heading: (d.telemetry.heading + 2) % 360,
                                    voltage: d.battery > 50 ? 12.2 : 11.8,
                                    current: 4.5 + Math.random(),
                                    satellites: 14 + Math.floor(Math.random() * 3),
                                    rssi: -60 - Math.floor(Math.random() * 10)
                                },
                                history: newHistory
                            };
                        }
                        return d;
                    }));
                } else {
                    clearInterval(timer);
                    setTimeout(() => {
                        setIsPatrolling(false);
                        setWaypoints([]);
                        setDrones(prev => prev.map(d =>
                            d.id === selectedDrone ? {
                                ...d,
                                status: 'idle',
                                telemetry: { ...d.telemetry, speed: 0, depth: 0, pitch: 0, roll: 0, current: 0.5 }
                            } : d
                        ));
                        addLog('Миссия успешно завершена', 'success');
                    }, 100);
                }
            }, 1000);
        }
    };

    const handleSearch = () => {
        if (searchQuery && mapRef.current) {
            const found = NATURE_RESERVES.find(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
            if (found) {
                handleSelectReserve(found);
            } else {
                addLog(`Поиск региона: ${searchQuery}`, 'info');
            }
        }
    };

    const handleSelectReserve = (reserve: ReserveData) => {
        setSearchQuery(reserve.name);
        setShowSuggestions(false);
        if (mapRef.current) {
            mapRef.current.setCenter(reserve.center, reserve.zoom, { duration: 1000 });
            addLog(`Переход к: ${reserve.name}`, 'success');
        }
    };

    const activeDrone = drones.find(d => d.id === selectedDrone);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-deep-ocean)', color: 'var(--color-text-main)' }}>
            {/* Extended Sidebar */}
            <div className="glass-panel" style={{
                width: '450px',
                height: '100%',
                borderRight: '1px solid var(--glass-border)',
                borderRadius: '0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                boxShadow: '4px 0 15px rgba(0,0,0,0.5)',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Droplets size={32} color="var(--color-teal)" />
                        <h2 style={{ fontSize: '1.5rem', color: '#fff', letterSpacing: '2px', fontWeight: '800' }}>ВОДЯНОЙ</h2>
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-teal)',
                        color: 'var(--color-teal)',
                        letterSpacing: '1px',
                        backgroundColor: 'rgba(0, 230, 246, 0.05)'
                    }}>
                        LIVE MONITOR
                    </div>
                </div>

                {/* Search */}
                <div style={{ marginBottom: '20px', flexShrink: 0, position: 'relative' }}>
                    <div className="input-group">
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Поиск заповедника (Байкал, Алтай...)"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ width: '100%', paddingLeft: '40px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                            />
                            <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                            <button onClick={handleSearch} className="btn-primary" style={{ padding: '0 16px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                                Искать
                            </button>
                        </div>
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1100,
                            marginTop: '5px',
                            background: 'rgba(1, 10, 21, 0.95)',
                            padding: '10px 0',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {suggestions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectReserve(s)}
                                    style={{
                                        padding: '10px 20px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'background 0.2s'
                                    }}
                                    className="suggestion-item"
                                >
                                    <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.type === 'reserve' ? 'Заповедник' : 'Нац. парк'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '25px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={20} color="var(--color-teal)" />
                        Оператор: {user?.name}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        {user?.platformKey ? (
                            <p>Ключ доступа: ****-{user.platformKey.split('-')[1]?.substring(0, 4)}</p>
                        ) : (
                            <p style={{ color: 'var(--color-coral)' }}>Платформа заблокирована: Сгенерируйте ключ в профиле</p>
                        )}
                    </div>
                </div>

                {/* Drone List */}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Флот Дронов</h3>
                <div style={{ marginBottom: '25px' }}>
                    {drones.map(drone => (
                        <div
                            key={drone.id}
                            className="glass-card"
                            onClick={() => setSelectedDrone(drone.id)}
                            style={{
                                padding: '16px',
                                marginBottom: '10px',
                                cursor: 'pointer',
                                borderColor: selectedDrone === drone.id ? 'var(--color-teal)' : 'transparent',
                                boxShadow: selectedDrone === drone.id ? 'var(--neon-glow-teal)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ color: '#fff' }}>{drone.name}</h4>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: drone.status === 'patrolling' ? 'rgba(0, 230, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    color: drone.status === 'patrolling' ? 'var(--color-teal)' : 'var(--color-text-muted)'
                                }}>
                                    {drone.status === 'patrolling' ? 'В пути' : 'Ожидает'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Battery size={14} color={drone.battery > 20 ? '#00E6F6' : '#FF6B6B'} />
                                    {drone.battery}%
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Activity size={14} />
                                    {drone.waterSamples}
                                </div>
                                <div className={`status-badge ${drone.telemetry.rssi > -80 ? 'status-green' : 'status-red'}`}>
                                    {drone.telemetry.rssi} dBm
                                </div>
                                <div className={`status-badge ${drone.telemetry.satellites > 0 ? 'status-green' : 'status-red'}`}>
                                    GPS: {drone.telemetry.satellites}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* GCS Professional View */}
                {activeDrone && (
                    <div className="glass-card" style={{ padding: '20px', marginBottom: '25px', background: 'rgba(1, 10, 21, 0.8)' }}>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <PFD pitch={activeDrone.telemetry.pitch} roll={activeDrone.telemetry.roll} heading={activeDrone.telemetry.heading} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Тренд глубины</h3>
                                <TelemetryChart data={activeDrone.history} color="var(--color-teal)" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="telemetry-item">
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>VOLTAGE</span>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>{activeDrone.telemetry.voltage.toFixed(1)}V</div>
                            </div>
                            <div className="telemetry-item">
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>CURRENT</span>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>{activeDrone.telemetry.current.toFixed(1)}A</div>
                            </div>
                            <div className="telemetry-item">
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>DEPTH</span>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>{activeDrone.telemetry.depth.toFixed(1)}m</div>
                            </div>
                            <div className="telemetry-item">
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>TEMP</span>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>{activeDrone.telemetry.temperature.toFixed(1)}°C</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Command Center */}
                <div style={{ marginBottom: '25px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button
                            onClick={() => { setDrawMode('route'); setCurrentPolygon([]); }}
                            className={drawMode === 'route' ? 'btn-primary' : 'btn-secondary'}
                            style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                            disabled={isPatrolling}
                        >
                            <SquareDashed size={14} /> Маршрут
                        </button>
                        <button
                            onClick={() => { setDrawMode('reserve'); setCurrentPolygon([]); }}
                            className={drawMode === 'reserve' ? 'btn-primary' : 'btn-secondary'}
                            style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                            disabled={isPatrolling}
                        >
                            <Trees size={14} /> Заповедник
                        </button>
                        <button
                            onClick={() => { setDrawMode('water'); setCurrentPolygon([]); }}
                            className={drawMode === 'water' ? 'btn-primary' : 'btn-secondary'}
                            style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                            disabled={isPatrolling}
                        >
                            <Waves size={14} /> Вода
                        </button>
                    </div>

                    {(drawMode === 'reserve' || drawMode === 'water') && currentPolygon.length > 0 && (
                        <button onClick={finishPolygon} className="btn-primary" style={{ width: '100%', marginBottom: '10px', background: 'linear-gradient(45deg, #00ffaa, #00E6F6)' }}>
                            <Check size={18} /> Завершить область ({currentPolygon.length} т.)
                        </button>
                    )}

                    {activeDrone && waypoints.length > 0 && !isPatrolling && (
                        <button onClick={handleLaunch} className="btn-primary" style={{ width: '100%', padding: '16px', fontWeight: '800', letterSpacing: '1px' }}>
                            <Navigation size={18} /> ЗАПУСК МИССИИ
                        </button>
                    )}
                    {isPatrolling && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleRTL} className="btn-secondary" style={{ flex: 1, padding: '12px', color: 'var(--color-yellow)', borderColor: 'var(--color-yellow)' }}>
                                RTL
                            </button>
                            <button onClick={handleLand} className="btn-secondary" style={{ flex: 1, padding: '12px', color: 'var(--color-coral)', borderColor: 'var(--color-coral)' }}>
                                LAND
                            </button>
                        </div>
                    )}
                    {waypoints.length === 0 && !isPatrolling && (
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '16px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                            {waterBodies.length > 0 ? 'КЛИКАЙТЕ ПО ВОДЕ ДЛЯ ПОСТРОЕНИЯ ПУТИ' : 'ОТМЕТЬТЕ ВОДНЫЙ ОБЪЕКТ ДЛЯ ЗАПУСКА'}
                        </p>
                    )}
                    {(waypoints.length > 0 || reserves.length > 0 || waterBodies.length > 0) && !isPatrolling && (
                        <div style={{ marginTop: '10px' }}>
                            {!showClearConfirm ? (
                                <button onClick={() => setShowClearConfirm(true)} className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.7rem', opacity: 0.6, color: 'var(--color-coral)' }}>
                                    ОЧИСТИТЬ КАРТУ
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => {
                                        setWaypoints([]); setReserves([]); setWaterBodies([]); setCurrentPolygon([]); setCurrentPos(null);
                                        setShowClearConfirm(false);
                                        addLog('Все данные удалены', 'warning');
                                    }} className="btn-primary" style={{ flex: 1, background: 'var(--color-coral)', fontSize: '0.7rem' }}>
                                        УДАЛИТЬ ВСЁ
                                    </button>
                                    <button onClick={() => setShowClearConfirm(false)} className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem' }}>
                                        ОТМЕНА
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mission Logs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Журнал событий</h3>
                    <div className="glass-panel" style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
                        {logs.map(log => (
                            <div key={log.id} style={{ fontSize: '0.85rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--color-text-muted)', marginRight: '8px' }}>[{log.time}]</span>
                                <span style={{
                                    color: log.type === 'success' ? '#00E6F6' : log.type === 'warning' ? '#FF6B6B' : 'var(--color-text-main)'
                                }}>{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map & Video Area */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Dynamic Camera Feed Area */}
                <div style={{
                    height: isCameraEnabled ? '40%' : '60px',
                    position: 'relative',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderBottom: '2px solid var(--glass-border)',
                    overflow: 'hidden',
                    background: '#000'
                }}>
                    {isCameraEnabled ? (
                        <CameraFeed activeDrone={activeDrone} />
                    ) : (
                        <div onClick={() => setIsCameraEnabled(true)} style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.5)' }}>
                            <div className="btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 12px' }}>ВКЛЮЧИТЬ КАМЕРУ</div>
                        </div>
                    )}

                    {/* Camera Control Overlay */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 100 }}>
                        <button onClick={(e) => { e.stopPropagation(); setIsCameraEnabled(!isCameraEnabled); }} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.6rem', background: 'rgba(10,25,47,0.8)' }}>
                            {isCameraEnabled ? 'ЗАКРЫТЬ' : 'КАМЕРА'}
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <YMaps query={{ apikey: 'fe27ef98-c1a7-47f5-939e-28956b66babe', lang: 'ru_RU' }}>
                        {/* NOTE: API key is a placeholder public Yandex Maps key for demo purposes. In production, use your own. */}
                        <Map
                            defaultState={{ center: MAP_CENTER, zoom: 4 }}
                            style={{ width: '100%', height: '100%' }}
                            onClick={handleMapClick}
                            instanceRef={ref => { if (ref) mapRef.current = ref; }}
                            options={{
                                // Force dark theme if API supports it natively, otherwise we rely on CSS filters below
                                suppressMapOpenBlock: true,
                            }}
                        >
                            <ZoomControl options={{ position: { right: 10, top: 108 } }} />

                            {/* Nature Reserves */}
                            {reserves.map((poly, idx) => (
                                <Polygon
                                    key={`reserve-${idx}`}
                                    geometry={[poly]}
                                    options={{
                                        fillColor: '#00ff95',
                                        fillOpacity: 0.15,
                                        strokeColor: '#00ff95',
                                        strokeWidth: 2,
                                        strokeStyle: 'solid',
                                        strokeOpacity: 0.6
                                    }}
                                />
                            ))}

                            {/* Water Bodies */}
                            {waterBodies.map((poly, idx) => (
                                <Polygon
                                    key={`water-${idx}`}
                                    geometry={[poly]}
                                    options={{
                                        fillColor: '#00E6F6',
                                        fillOpacity: 0.3,
                                        strokeColor: '#00E6F6',
                                        strokeWidth: 2,
                                        strokeStyle: 'solid',
                                        strokeOpacity: 0.8
                                    }}
                                />
                            ))}

                            {/* Current Drawing Polygon */}
                            {currentPolygon.length > 1 && (
                                <Polygon
                                    geometry={[currentPolygon]}
                                    options={{
                                        fillColor: drawMode === 'reserve' ? '#00ff95' : '#00E6F6',
                                        fillOpacity: 0.3,
                                        strokeColor: '#fff',
                                        strokeWidth: 2,
                                        strokeStyle: 'dash'
                                    }}
                                />
                            )}

                            {/* Path */}
                            {waypoints.length > 1 && (
                                <Polyline
                                    geometry={waypoints}
                                    options={{
                                        strokeColor: '#00E6F6',
                                        strokeWidth: 3,
                                        strokeOpacity: 0.6,
                                        strokeStyle: 'dash'
                                    }}
                                />
                            )}

                            {/* Premium Waypoints */}
                            {waypoints.map((wp, i) => (
                                <Placemark
                                    key={`wp-${i}`}
                                    geometry={wp}
                                    properties={{
                                        iconCaption: i === 0 ? 'СТАРТ' : `Т-${i}`,
                                        hintContent: 'Shift + Клик для удаления'
                                    }}
                                    options={{
                                        preset: i === 0 ? 'islands#darkGreenDotIcon' : 'islands#darkBlueCircleDotIcon',
                                        iconColor: i === 0 ? '#00ffaa' : '#00E6F6',
                                    }}
                                    onClick={(e: any) => {
                                        if (e.get('domEvent').get('shiftKey')) {
                                            removeWaypoint(i);
                                        }
                                    }}
                                />
                            ))}

                            {/* Current Polygon Points */}
                            {currentPolygon.map((p, i) => (
                                <Placemark
                                    key={`cp-${i}`}
                                    geometry={p}
                                    options={{
                                        preset: 'islands#yellowCircleDotIconSmall'
                                    }}
                                />
                            ))}

                            {/* Drone Position */}
                            {currentPos && (
                                <Placemark
                                    geometry={currentPos}
                                    properties={{
                                        hintContent: activeDrone?.name,
                                        balloonContent: `<strong>${activeDrone?.name}</strong><br/>Мониторинг...`
                                    }}
                                    options={{
                                        iconLayout: 'default#image',
                                        iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgc3Ryb2tlPSIjMDBFNkY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCI+PGFuaW1hdGVSb3RhdGUgYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIGZyb209IjAgMjAgMjAiIHRvPSIzNjAgMjAgMjAiIGR1cj0iMTBzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEyIiBzdHJva2U9IiMwMEU2RjYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ij48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJyIiB2YWx1ZXM9IjEyOzE2OzEyIiBkdXI9IjJzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjQiIGZpbGw9IiMwMEU2RjYiPjxhamltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iMTswLjU7MSIgZHVyPSIycyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2NpcmNsZT48L3N2Zz4=',
                                        iconImageSize: [40, 40],
                                        iconImageOffset: [-20, -20],
                                    }}
                                />
                            )}
                        </Map>
                    </YMaps>

                    {/* Blue Overly Tint */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'radial-gradient(circle at 50% 50%, rgba(0, 230, 246, 0.05) 0%, rgba(1, 10, 21, 0.4) 100%)',
                        pointerEvents: 'none',
                        zIndex: 400
                    }}></div>
                </div>
            </div>
        </div>
    );
}
