"use client";

import { useState, useEffect } from "react";
import { getToken, clearToken } from "@trackflow/core";
import { API_BASE } from "@/lib/constants";

interface ProfileData {
  name: string;
  phone: string;
  address: string;
}

interface UserInfo {
  email: string;
  role: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profile, setProfile] = useState<ProfileData>({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = "/login?redirect=/account/profile";
        return;
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setUser({ email: data.email, role: data.role });

      if (data.profile) {
        setProfile({
          name: data.profile.name ?? "",
          phone: data.profile.phone ?? "",
          address: data.profile.address ?? "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar perfil");
      if (String(err).includes("401") || String(err).includes("Unauthorized")) {
        clearToken();
        window.location.href = "/login?reason=session_expired";
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const updated = await res.json();
      setProfile({
        name: updated.name ?? "",
        phone: updated.phone ?? "",
        address: updated.address ?? "",
      });
      setFeedback("✅ Perfil actualizado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      if (String(err).includes("401") || String(err).includes("Unauthorized")) {
        clearToken();
        window.location.href = "/login?reason=session_expired";
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-[#2f4a62]">⏳ Cargando perfil...</p>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    admin: "Administrador",
    manager: "Gestor",
    user: "Usuario",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#14263a]">Mi perfil</h1>
        <p className="text-sm text-[#2f4a62]">Gestiona tu información personal</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Información de la cuenta
        </h2>
        <div className="space-y-3">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium text-[#2f4a62]">Email:</span>
                <span className="font-mono text-sm text-[#14263a]">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium text-[#2f4a62]">Rol:</span>
                <span className="text-sm text-[#14263a]">{roleLabel[user.role] || user.role}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Datos de contacto
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="profileName" className="mb-1 block text-sm font-medium text-[#14263a]">Nombre</label>
            <input
              id="profileName"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="profilePhone" className="mb-1 block text-sm font-medium text-[#14263a]">Teléfono</label>
            <input
              id="profilePhone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
              placeholder="+34 600 000 000"
            />
          </div>
          <div>
            <label htmlFor="profileAddress" className="mb-1 block text-sm font-medium text-[#14263a]">Dirección</label>
            <input
              id="profileAddress"
              type="text"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
              placeholder="Calle, ciudad, código postal"
            />
          </div>

          {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}

          <button type="submit" disabled={saving} className="rounded-lg bg-[#14263a] px-6 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50 flex items-center gap-2">
            {saving ? "⏳ Guardando..." : "💾 Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}