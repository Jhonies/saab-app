import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

console.log('Login Renderizado')
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/logo-saab.svg'
import styles from './Login.module.css'

const ROLE_REDIRECT = {
  ADMIN:     '/admin/dashboard',
  CLIENTE:   '/cliente/catalog',
  MOTORISTA: '/motorista/routes',
}

const IconEmail = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75
         m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0L12 13.5 2.25 6.75" />
  </svg>
)

const IconLock = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V7.125a4.5 4.5 0 10-9 0V10.5
         m-2.25 0h13.5A1.5 1.5 0 0120.25 12v7.5A1.5 1.5 0 0118.75 21
         H5.25a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z" />
  </svg>
)

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

        <img src={logoSaab} alt="SAAB" className={styles.logo} />

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardHeaderEyebrow}>Gestão Logística</p>
            <h1 className={styles.cardHeaderTitle}>SAAB</h1>
          </div>

          <div className={styles.cardBody}>
            <p className={styles.subtitle}>Insira as suas credenciais para continuar.</p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}><IconEmail /></span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="utilizador@saab.pt"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}><IconLock /></span>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={styles.input}
                  />
                </div>
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
                    A autenticar…
                  </>
                ) : 'Entrar'}
              </button>

            </form>
          </div>
        </div>

        <p className={styles.footer}>SAAB &copy; {new Date().getFullYear()}</p>

      </div>
    </div>
  )
}

export default Login
