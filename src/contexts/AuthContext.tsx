import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD || 'family2026'
const ADMIN_USERNAME = 'admin'
const VIEWER_USERNAME = 'viewer'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // セッションからユーザー情報を復元
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('user')
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    if (password !== AUTH_PASSWORD) {
      return false
    }

    const newUser: User = {
      id: username,
      username: username,
      role: username === ADMIN_USERNAME ? 'admin' : 'viewer',
      created_at: new Date().toISOString(),
    }

    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
