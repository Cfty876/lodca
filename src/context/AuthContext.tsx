import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    platformKey?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => boolean;
    register: (name: string, email: string, password?: string) => boolean;
    logout: () => void;
    generatePlatformKey: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Load active session from localStorage on mount
    useEffect(() => {
        const sessionUserId = localStorage.getItem('activeUserId');
        if (sessionUserId) {
            const usersStr = localStorage.getItem('platform_users');
            if (usersStr) {
                const users: User[] = JSON.parse(usersStr);
                const found = users.find(u => u.id === sessionUserId);
                if (found) {
                    setUser(found);
                }
            }
        }
    }, []);

    const saveUserToDB = (updatedUser: User) => {
        const usersStr = localStorage.getItem('platform_users');
        let users: User[] = usersStr ? JSON.parse(usersStr) : [];
        users = users.filter(u => u.id !== updatedUser.id);
        users.push(updatedUser);
        localStorage.setItem('platform_users', JSON.stringify(users));
        setUser(updatedUser);
    };

    const login = (email: string, password?: string) => {
        const usersStr = localStorage.getItem('platform_users');
        if (usersStr) {
            const users: User[] = JSON.parse(usersStr);
            const found = users.find(u => u.email === email && u.password === password);
            if (found) {
                localStorage.setItem('activeUserId', found.id);
                setUser(found);
                return true;
            }
        }
        return false;
    };

    const register = (name: string, email: string, password?: string) => {
        const usersStr = localStorage.getItem('platform_users');
        const users: User[] = usersStr ? JSON.parse(usersStr) : [];

        if (users.find(u => u.email === email)) {
            return false; // Email already exists
        }

        const newUser: User = {
            id: Date.now().toString(),
            name,
            email,
            password
        };

        users.push(newUser);
        localStorage.setItem('platform_users', JSON.stringify(users));
        localStorage.setItem('activeUserId', newUser.id);
        setUser(newUser);
        return true;
    };

    const logout = () => {
        localStorage.removeItem('activeUserId');
        setUser(null);
    };

    const generatePlatformKey = () => {
        if (user) {
            const key = 'VODYANOY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            const updatedUser = { ...user, platformKey: key };
            saveUserToDB(updatedUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, generatePlatformKey }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
