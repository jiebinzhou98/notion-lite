// src/hook/useAuth.ts
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"  // 你项目里的 supabase client
import type { User } from '@supabase/supabase-js'


export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null)
            setLoading(false)
        })

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => {
            listener?.subscription.unsubscribe()
        }
    }, [])

    const signInWithProvider = async (provider: 'github' | 'google') => {
  const { error } = await supabase.auth.signInWithOAuth({ provider })
  if (error) throw error
}


    const login = async (email: string) => {
        // 发送魔法链接登录
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) throw error
        // 之后用户会去邮箱点击链接完成登录
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return { user, loading, login, logout, signInWithProvider }
}
