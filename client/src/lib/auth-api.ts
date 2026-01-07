// lib/auth-api.ts
export async function loginRequest(email: string, password: string, rememberMe: boolean) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, rememberMe }),
    credentials: "include",
  });

  const data = await res.json();
  
  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}