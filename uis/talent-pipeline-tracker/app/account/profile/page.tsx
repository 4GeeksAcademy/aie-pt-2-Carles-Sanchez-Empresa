"use client";

import { FormEvent, useEffect, useState } from "react";
import { getAuthMe, updateProfile } from "@/services/auth";
import { isValidPhone, PHONE_ERROR } from "@/lib/validation";

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getAuthMe();
        setEmail(me.email);
        setName(me.profile?.name || "");
        setPhone(me.profile?.phone || "");
        setAddress(me.profile?.address || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar perfil.");
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
      setError(PHONE_ERROR);
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
      setFeedback("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 text-center text-sm text-[#2f4a62]">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">Mi perfil</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">Gestiona tus datos de cuenta y contacto.</p>

        <div className="mt-4 rounded-lg border border-[#c89d66] bg-[#f8fbff] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2f4a62]">Email de la cuenta</p>
          <p className="mt-1 text-sm text-[#14263a]">{email || "-"}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#2f4a62]">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#2f4a62]">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-[#2f4a62]">
              Dirección
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="Calle, ciudad y código postal"
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
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>
    </div>
  );
}
