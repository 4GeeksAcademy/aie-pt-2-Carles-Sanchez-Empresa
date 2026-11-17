#!/usr/bin/env bash
# TrackFlow Linux host hardening (Debian/Ubuntu with systemd + UFW).
# Run from an existing sudo-capable, non-root SSH session; keep that session open
# and verify a second SSH login before closing it. Do not run from Codespaces.
set -Eeuo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  echo "ERROR: run as a sudo-capable non-root account, not root." >&2
  exit 1
fi
if ! command -v sudo >/dev/null 2>&1; then
  echo "ERROR: sudo is required." >&2
  exit 1
fi
sudo -v
if ! command -v systemctl >/dev/null 2>&1 || ! command -v sshd >/dev/null 2>&1; then
  echo "ERROR: systemd and OpenSSH server are required." >&2
  exit 1
fi
if [[ ! -n "${SSH_CONNECTION:-}" ]]; then
  echo "ERROR: SSH_CONNECTION is unset; run only from the active SSH session to preserve its port." >&2
  exit 1
fi

read -r _client_ip _client_port _server_ip ssh_port <<<"${SSH_CONNECTION}"
if [[ ! "${ssh_port}" =~ ^[0-9]+$ ]] || (( ssh_port < 1 || ssh_port > 65535 )); then
  echo "ERROR: cannot determine the active SSH server port safely." >&2
  exit 1
fi

if [[ -n "${TRACKFLOW_EXTRA_TCP_PORTS:-}" ]]; then
  echo "ERROR: extra host ports require a reviewed production topology; this script only allows SSH(${ssh_port}), HTTP(80), and HTTPS(443)." >&2
  exit 1
fi
if [[ -z "${TRACKFLOW_OPS_PUBLIC_KEY:-}" ]]; then
  echo "ERROR: set TRACKFLOW_OPS_PUBLIC_KEY to the dedicated operator's SSH public key; no private key is accepted or stored." >&2
  exit 1
fi
if ! command -v ssh-keygen >/dev/null 2>&1 || ! printf '%s\n' "${TRACKFLOW_OPS_PUBLIC_KEY}" | ssh-keygen -lf - >/dev/null 2>&1; then
  echo "ERROR: TRACKFLOW_OPS_PUBLIC_KEY is not a supported OpenSSH public key." >&2
  exit 1
fi
if [[ "${TRACKFLOW_CONFIRM_UFW_RESET:-}" != "YES" ]]; then
  echo "ERROR: set TRACKFLOW_CONFIRM_UFW_RESET=YES after reviewing the production port topology; UFW rules will be reset." >&2
  exit 1
fi
if systemctl is-active --quiet docker 2>/dev/null; then
  echo "ERROR: Docker is active. Published container ports can bypass UFW; first restrict Docker ingress with a reviewed DOCKER-USER policy or bind services to loopback, then rerun host hardening." >&2
  exit 1
fi

service_user=trackflow-svc
ops_user=trackflow-ops
if id "${ops_user}" >/dev/null 2>&1; then
  echo "ERROR: ${ops_user} already exists; review its SSH keys and sudo policy manually instead of overwriting it." >&2
  exit 1
fi
if id "${service_user}" >/dev/null 2>&1; then
  existing_shell="$(getent passwd "${service_user}" | cut -d: -f7)"
  if [[ "${existing_shell}" != */nologin ]]; then
    echo "ERROR: ${service_user} already exists with an interactive shell; refusing to alter an existing login account." >&2
    exit 1
  fi
else
  sudo useradd --system --create-home --home-dir /var/lib/trackflow --shell /usr/sbin/nologin "${service_user}"
fi
sudo usermod --shell /usr/sbin/nologin "${service_user}"
sudo usermod --lock "${service_user}"

# Create a separate, key-authenticated, sudo-capable daily operator account.
# Never overwrite an existing account or its authorized_keys implicitly.
sudo useradd --create-home --shell /bin/bash --groups sudo "${ops_user}"
echo "Set a strong sudo password for ${ops_user}; this password is not used for SSH authentication."
sudo passwd "${ops_user}"
sudo install -d -o "${ops_user}" -g "${ops_user}" -m 0700 "/home/${ops_user}/.ssh"
printf '%s\n' "${TRACKFLOW_OPS_PUBLIC_KEY}" | sudo tee "/home/${ops_user}/.ssh/authorized_keys" >/dev/null
sudo chown "${ops_user}:${ops_user}" "/home/${ops_user}/.ssh/authorized_keys"
sudo chmod 0600 "/home/${ops_user}/.ssh/authorized_keys"

sudo install -d -o "${service_user}" -g "${service_user}" -m 0750 /var/lib/trackflow
sudo install -d -o root -g "${service_user}" -m 0750 /opt/trackflow
sudo install -d -o "${service_user}" -g "${service_user}" -m 0750 /var/log/trackflow
sudo install -d -o root -g "${service_user}" -m 0750 /etc/trackflow
sudo chown "${service_user}:${service_user}" /var/lib/trackflow /var/log/trackflow
sudo chown root:"${service_user}" /opt/trackflow

# Keep local edits: install a drop-in with high precedence, then validate before reload.
sudo install -d -m 0755 /etc/ssh/sshd_config.d
sudo tee /etc/ssh/sshd_config.d/00-trackflow-hardening.conf >/dev/null <<'EOF'
PermitRootLogin no
# PasswordAuthentication is intentionally not changed: preserve existing access
# until key-based access has been independently verified on this host.
EOF
sudo tee /etc/ssh/sshd_config.d/99-trackflow-ops.conf >/dev/null <<'EOF'
Match User trackflow-ops
  PubkeyAuthentication yes
  AuthenticationMethods publickey
  PasswordAuthentication no
  KbdInteractiveAuthentication no
Match all
EOF
sudo sshd -t
sudo systemctl reload ssh 2>/dev/null || sudo systemctl reload sshd
effective_root_login="$(sudo sshd -T | awk '$1 == "permitrootlogin" {print $2; exit}')"
if [[ "${effective_root_login}" != "no" ]]; then
  echo "ERROR: effective sshd PermitRootLogin is '${effective_root_login}', expected 'no'. Review sshd configuration." >&2
  exit 1
fi
ops_auth="$(sudo sshd -T -C "user=${ops_user},host=$(hostname -f 2>/dev/null || hostname),addr=${_client_ip}")"
if ! grep -qx 'authenticationmethods publickey' <<<"${ops_auth}" \
  || ! grep -qx 'pubkeyauthentication yes' <<<"${ops_auth}" \
  || ! grep -qx 'passwordauthentication no' <<<"${ops_auth}" \
  || ! grep -qx 'kbdinteractiveauthentication no' <<<"${ops_auth}"; then
  echo "ERROR: effective SSH policy for ${ops_user} is not public-key-only; inspect sshd configuration." >&2
  exit 1
fi
printf '\nSSH root login is disabled and %s is configured for public-key-only authentication.\n' "${ops_user}"
read -r -p "Open a SECOND terminal and verify SSH as ${ops_user} with the matching private key. Keep this session open. Type VERIFIED after it succeeds: " ssh_verified
if [[ "${ssh_verified}" != "VERIFIED" ]]; then
  echo "ERROR: second SSH login was not confirmed. UFW has not been changed, but the new account/sshd policy may already exist; keep this session open and recover access before exiting." >&2
  exit 1
fi
root_check=""
read -r -p "Confirm a separate SSH attempt as root@host was rejected (do not enter any root password). Type ROOT_DENIED: " root_check
if [[ "${root_check}" != "ROOT_DENIED" ]]; then
  echo "ERROR: direct root SSH denial was not confirmed. UFW has not been changed; keep the original session open and investigate." >&2
  exit 1
fi

if ! command -v ufw >/dev/null 2>&1; then
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "ERROR: UFW is missing and automatic installation is supported only on Debian/Ubuntu." >&2
    exit 1
  fi
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ufw
fi

# Preserve prior UFW state for rollback, then install minimal ingress policy.
# This deliberately removes legacy allow rules; inspect the host/provider
# topology before confirmation.
backup_dir="/var/backups/trackflow-ufw-$(date -u +%Y%m%dT%H%M%SZ)"
sudo install -d -m 0700 "${backup_dir}"
sudo tar -C / -czf "${backup_dir}/ufw-config.tgz" etc/ufw
sudo ufw --force reset

# Add required allows BEFORE enabling to avoid cutting off this SSH session.
sudo ufw allow "${ssh_port}/tcp" comment 'TrackFlow SSH administration'
sudo ufw allow 443/tcp comment 'TrackFlow HTTPS application'
if [[ "${TRACKFLOW_ALLOW_HTTP:-0}" == "1" ]]; then
  sudo ufw allow 80/tcp comment 'TrackFlow HTTP (redirect/ACME only)'
fi
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw --force enable

printf '\nHardening applied. Verify a second SSH session before closing this one.\n'
printf 'SSH port detected: %s/tcp\n' "${ssh_port}"
printf 'UFW rollback backup: %s\n' "${backup_dir}"
printf '\nEffective SSH settings:\n'
sudo sshd -T | awk '$1 == "permitrootlogin" || $1 == "passwordauthentication" {print}'
sudo sshd -T -C "user=${ops_user},host=$(hostname -f 2>/dev/null || hostname),addr=${_client_ip}" | awk '$1 == "authenticationmethods" || $1 == "pubkeyauthentication" || $1 == "passwordauthentication" || $1 == "kbdinteractiveauthentication" {print}'
printf '\nUFW status:\n'
sudo ufw status verbose
printf '\nManaged directory ownership/modes:\n'
sudo stat -c '%U:%G %a %n' /opt/trackflow /etc/trackflow /var/log/trackflow /var/lib/trackflow
printf '\nDedicated operator account:\n'
id "${ops_user}"
sudo stat -c '%U:%G %a %n' "/home/${ops_user}/.ssh" "/home/${ops_user}/.ssh/authorized_keys"
printf '\nNon-root account:\n'
id "${service_user}"
