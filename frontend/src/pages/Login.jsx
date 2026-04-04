import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import styles from './Login.module.css'

const ROLE_REDIRECT = {
  ADMIN:     '/admin/dashboard',
  EXPEDICAO: '/expedicao/dashboard',
  CLIENTE:   '/cliente/orders',
  MOTORISTA: '/motorista/routes',
  VENDEDOR:  '/vendedor/orders',
}

const Login = () => {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Preencha o email e a password.')
      return
    }

    setLoading(true)
    try {
      const role = await login(email, password)
      navigate(ROLE_REDIRECT[role] || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao autenticar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>

        <div className={styles.brand}>
          <img src={logoSaab} alt="SAAB" className={styles.logo} />
          <h1 className={styles.brandName}>SAAB</h1>
          <p className={styles.brandSub}>Gestão Logística</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduza a sua password"
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? (
              <>
                <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" opacity="0.75"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                A entrar...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <p className={styles.footer}>SAAB &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

export default Login
