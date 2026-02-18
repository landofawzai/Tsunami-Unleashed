'use client'

// Translator Portal — Login Page
// Mobile-first, large touch targets, simple form

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/translate/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Redirect to portal home (or saved language)
      const savedLang = localStorage.getItem('translate_lang')
      router.push(savedLang ? `/translate/${savedLang}` : '/translate')
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Sign In</h1>
        <p className="login-subtitle">
          Reviewers and translators — sign in to access review controls
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          className="back-link"
          onClick={() => router.push('/translate')}
        >
          Back to translations
        </button>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 56px);
          padding: 1rem;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 16px;
          padding: 2rem 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
          text-align: center;
        }
        .login-subtitle {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0 0 1.5rem;
          text-align: center;
          line-height: 1.4;
        }
        .login-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }
        .form-group input {
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          color: #111827;
          background: #f9fafb;
          min-height: 48px;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .form-group input:focus {
          outline: none;
          border-color: #8b5cf6;
          background: white;
        }
        .login-btn {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
          border: none;
          padding: 0.875rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          min-height: 48px;
          margin-top: 0.5rem;
          transition: opacity 0.2s;
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-btn:active:not(:disabled) {
          opacity: 0.8;
        }
        .back-link {
          display: block;
          text-align: center;
          color: #6b7280;
          font-size: 0.85rem;
          margin-top: 1.25rem;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  )
}
