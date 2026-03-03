import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/client';
import AuthContext from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from profiles table
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // 1. Auth listener: only sync session/user state — no Supabase queries here.
  //    Running queries inside onAuthStateChange can deadlock during token refresh.
  useEffect(() => {
    // Register listener FIRST (picks up PKCE code exchange & INITIAL_SESSION).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) setProfile(null);
        setLoading(false);
      }
    );

    // Then kick off initial session restore (fallback for older Supabase versions).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch profile in a SEPARATE effect whenever `user` changes.
  //    This keeps Supabase queries out of the auth callback.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    fetchProfile(user.id).then((data) => {
      if (!cancelled) setProfile(data);
    });
    return () => { cancelled = true; };
  }, [user, fetchProfile]);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/purpleit/' }
    });

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
