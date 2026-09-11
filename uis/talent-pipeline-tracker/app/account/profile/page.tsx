"use client";

import { FormEvent, useEffect, useState } from "react";
import { changePassword, getAuthMe, updateProfile } from "@/services/auth";
import { isValidPhone } from "@/lib/validation";
import { useTranslation } from "@/lib/i18n";

export default function AccountProfilePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Change Password state ───
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpFeedback, setCpFeedback] = useState<string | null>(null);
  const [cpSaving, setCpSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getAuthMe();
        setEmail(me.email);
        setName(me.profile?.name || "");
        setPhone(me.profile?.phone || "");
        setAddress(me.profile?.address || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("profile.error_load"));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (phone.trim() && !isValidPhone(phone.trim())) {
      setError(t("profile.error_phone"));
      return;
    }

    setSaving(true);
    try {
      const profile = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      setName(profile.name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setFeedback(t("profile.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.error_load"));
    } finally {
      setSaving(false);
    }
  };

  // ─── Change Password handler ───
  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCpError(null);
    setCpFeedback(null);

    if (!cpCurrent) {
      setCpError(t("profile.cp_required"));
      return;
    }
    if (cpNew.length < 6) {
      setCpError(t("profile.cp_min_length"));
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpError(t("profile.cp_mismatch"));
      return;
    }

    setCpSaving(true);
    try {
      await changePassword(cpCurrent, cpNew);
      setCpFeedback(t("profile.cp_success"));
      setCpCurrent("");
      setCpNew("");
      setCpConfirm("");
    } catch (err) {
      setCpError(err instanceof Error ? err.message : t("profile.cp_error"));
    } finally {
      setCpSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 text-center text-sm text-[#2f4a62]">
        {t("profile.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("profile.subtitle")}</p>

        <div className="mt-4 rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2f4a62]">{t("profile.email")}</p>
          <p className="mt-1 text-sm text-[#14263a]">{email || "-"}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#2f4a62]">
              {t("profile.name_label")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("profile.name_placeholder")}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#2f4a62]">
              {t("profile.phone_label")}
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("profile.phone_placeholder")}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-[#2f4a62]">
              {t("profile.address_label")}
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("profile.address_placeholder")}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {feedback && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
          >
            {saving ? t("profile.saving") : t("profile.save")}
          </button>
        </form>
      </section>

      {/* ─── Change Password card ─── */}
      <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#14263a]">{t("profile.change_password")}</h2>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <div>
            <label htmlFor="cp-current" className="block text-sm font-medium text-[#2f4a62]">
              {t("profile.current_password_label")}
            </label>
            <input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              value={cpCurrent}
              onChange={(e) => setCpCurrent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="cp-new" className="block text-sm font-medium text-[#2f4a62]">
              {t("profile.new_password_label")}
            </label>
            <input
              id="cp-new"
              type="password"
              autoComplete="new-password"
              value={cpNew}
              onChange={(e) => setCpNew(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="cp-confirm" className="block text-sm font-medium text-[#2f4a62]">
              {t("profile.confirm_password_label")}
            </label>
            <input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              value={cpConfirm}
              onChange={(e) => setCpConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="••••••••"
            />
          </div>

          {cpError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {cpError}
            </p>
          )}

          {cpFeedback && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {cpFeedback}
            </p>
          )}

          <button
            type="submit"
            disabled={cpSaving}
            className="rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
          >
            {cpSaving ? t("profile.saving") : t("profile.change_password_btn")}
          </button>
        </form>
      </section>
    </div>
  );
}
