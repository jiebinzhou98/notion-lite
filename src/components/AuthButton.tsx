"use client"
import React, { useState } from "react"
import { useAuth } from "@/hook/useAuth"

export default function AuthButton() {
  const { user, loading, login, logout, signInWithProvider } = useAuth()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleLogin = async () => {
    setMessage("")
    try {
      await login(email)
      setMessage("Magic link sent! Check your email.")
    } catch (error) {
      setMessage("Login failed.")
    }
  }

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setMessage("")
    try {
      await signInWithProvider(provider)
      setMessage("Redirecting to OAuth provider...")
    } catch (error) {
      setMessage("OAuth login failed.")
    }
  }

  if (loading) return <div>Loading...</div>

  if (user)
    return (
      <button onClick={() => logout()}>
        Logout ({user.email})
      </button>
    )

  return (
    <div>
      <button onClick={() => handleOAuthLogin('github')}>Login with GitHub</button>
      {/* <button onClick={() => handleOAuthLogin('google')}>Login with Google</button> */}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Send Magic Link</button>
      {message && <p>{message}</p>}
    </div>
  )
}
