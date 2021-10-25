import { api } from "../services/api";
import { createContext, useEffect, useState, ReactNode } from "react";

type AuthProvider = {
  children: ReactNode,
}

type User = {
  id: string,
  name: string,
  login: string,
  avatar_url: string,
}

type AuthContextData = {
  user: User | null,
  signInUrl: string,
  signOut: () => void;
}

type AuthResponse = {
  token: string,
  user: {
    id: string,
    name: string,
    login: string,
    avatar_url: string,
  }
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: AuthProvider) {
  const [user, setUser] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=45038bdabfdb71520b15`

  async function signIn(gitHubCode: string) {
    const response = await api.post<AuthResponse>('authenticate', {
      code: gitHubCode,
    })

    const { token, user } = response.data;

    localStorage.setItem('@auth:token', token);

    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  function signOut() {
    setUser(null)
    localStorage.removeItem('@auth:token');
  }

  useEffect(() => {
    const token = localStorage.getItem('@auth:token');

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;
      api.get<User>('profile').then(res => {
        setUser(res.data);
      });
    }
  }, []);

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      const [urlWithoutCode, gitHubCode] = url.split('?code=');
      window.history.pushState({}, '', urlWithoutCode);

      signIn(gitHubCode);
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}

