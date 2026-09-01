"use client";

import { useState, useEffect } from "react";
import { getToken, clearToken } from "@trackflow/core";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t("profile.error_load"));
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
      setFeedback(t("profile.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.error_save"));
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
        <p className="text-[#2f4a62]">{t("profile.loading")}</p>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    admin: t("profile.role_admin"),
    manager: t("profile.role_manager"),
    user: t("profile.role_user"),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#14263a]">{t("profile.title")}</h1>
        <p className="text-sm text-[#2f4a62]">{t("profile.subtitle")}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          {t("profile.account_info")}
        </h2>
        <div className="space-y-3">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium text-[#2f4a62]">{t("profile.email")}</span>
                <span className="font-mono text-sm text-[#14263a]">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium text-[#2f4a62]">{t("profile.role")}</span>
                <span className="text-sm text-[#14263a]">{roleLabel[user.role] || user.role}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          {t("profile.contact_info")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="profileName" className="mb-1 block text-sm font-medium text-[#14263a]">{t("profile.name_label")}</label>
            <input
              id="profileName"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
              placeholder={t("profile.name_placeholder")}
            />
          </div>
          <div>
            <label htmlFor="profilePhone" className="mb-1 block text-sm font-medium text-[#14263a]">{t("profile.phone_label")}</label>
            <input
              id="profilePhone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
              placeholder={t("profile.phone_placeholder")}
            />
          </div>
          <div>
            <label htmlFor="profileAddress" className="mb-1 block text-sm font-medium text-[#14263a]">{t("profile.address_label")}</label>
            <input
              id="profileAddress"
              type="text"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
              placeholder={t("profile.address_placeholder")}
            />
          </div>

          {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}

          <button type="submit" disabled={saving} className="rounded-lg bg-[#14263a] px-6 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50 flex items-center gap-2">
            {saving ? t("profile.saving") : t("profile.save")}
          </button>
        </form>
      </div>

      {/* ── Cambiar contraseña ── */}
      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cpFeedback, setCpFeedback] = useState<string | null>(null);
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSaving, setCpSaving] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setCpFeedback(null);
    setCpError(null);

    // Validaciones client-side
    if (!currentPassword) {
      setCpError("Introduce tu contraseña actual.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setCpError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setCpError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setCpSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (res.ok) {
        setCpFeedback("✅ Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setCpError(data.detail || "Error al cambiar la contraseña");
      }
    } catch {
      setCpError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setCpSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-orange-500" />
        Cambiar contraseña
      </h2>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="cpCurrentPassword" className="mb-1 block text-sm font-medium text-[#14263a]">Contraseña actual</label>
          <input
            id="cpCurrentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="cpNewPassword" className="mb-1 block text-sm font-medium text-[#14263a]">Nueva contraseña</label>
          <input
            id="cpNewPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <label htmlFor="cpConfirmPassword" className="mb-1 block text-sm font-medium text-[#14263a]">Confirmar nueva contraseña</label>
          <input
            id="cpConfirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
            placeholder="Repite la nueva contraseña"
          />
        </div>

        {cpFeedback && <p className="text-sm text-emerald-600">{cpFeedback}</p>}
        {cpError && <p className="text-sm text-red-500">❌ {cpError}</p>}

        <button
          type="submit"
          disabled={cpSaving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {cpSaving ? "⏳ Cambiando…" : "🔑 Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}