#!/usr/bin/env bash
# Read-only evidence collector. Run on the target Linux host; output contains
# configuration and filesystem metadata only (no keys, tokens, or file contents).
set -u

failures=0
check() {
  local label="$1" result="$2" detail="${3:-}"
  printf '%-36s %s' "$label" "$result"
  [[ -z "$detail" ]] || printf ' — %s' "$detail"
  printf '\n'
  [[ "$result" == PASS ]] || failures=$((failures + 1))
}

printf 'TrackFlow Linux host hardening evidence\n'
printf 'Captured UTC: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'Hostname: %s\n' "$(hostname -f 2>/dev/null || hostname)"
printf 'Kernel: %s\n\n' "$(uname -sr)"

if command -v sshd >/dev/null 2>&1; then
  effective="$(sudo sshd -T 2>/dev/null | awk '$1 == "permitrootlogin" {print $2; exit}')"
  check 'SSH PermitRootLogin=no' "$( [[ "$effective" == no ]] && echo PASS || echo FAIL )" "effective=${effective:-unknown}"
  ops_settings="$(sudo sshd -T -C "user=trackflow-ops,host=$(hostname -f 2>/dev/null || hostname),addr=127.0.0.1" 2>/dev/null)"
  auth_methods="$(printf '%s\n' "$ops_settings" | awk '$1 == "authenticationmethods" {print $2; exit}')"
  pubkey_auth="$(printf '%s\n' "$ops_settings" | awk '$1 == "pubkeyauthentication" {print $2; exit}')"
  password_auth="$(printf '%s\n' "$ops_settings" | awk '$1 == "passwordauthentication" {print $2; exit}')"
  keyboard_auth="$(printf '%s\n' "$ops_settings" | awk '$1 == "kbdinteractiveauthentication" {print $2; exit}')"
  check 'Operator SSH public-key only' "$( [[ "$auth_methods" == publickey && "$pubkey_auth" == yes && "$password_auth" == no && "$keyboard_auth" == no ]] && echo PASS || echo FAIL )" "methods=${auth_methods:-unknown}; pubkey=${pubkey_auth:-unknown}; password=${password_auth:-unknown}; keyboard-interactive=${keyboard_auth:-unknown}"
else
  check 'OpenSSH server config' FAIL 'sshd not found'
fi

if command -v ufw >/dev/null 2>&1; then
  ufw_output="$(sudo ufw status verbose 2>/dev/null)"
  ufw_state="$(printf '%s\n' "$ufw_output" | head -n 1)"
  check 'UFW active' "$( [[ "$ufw_state" == 'Status: active' ]] && echo PASS || echo FAIL )" "${ufw_state:-unavailable}"
  printf '%s\n' "$ufw_output" | sed 's/^/  /'
  default_in="$(printf '%s\n' "$ufw_output" | awk -F': ' '/Default:/ {print $2; exit}' | cut -d, -f1 | xargs)"
  default_out="$(printf '%s\n' "$ufw_output" | awk -F': ' '/Default:/ {print $2; exit}' | cut -d, -f2 | xargs)"
  check 'UFW default incoming deny' "$( [[ "$default_in" == 'deny (incoming)' ]] && echo PASS || echo FAIL )" "${default_in:-unknown}"
  check 'UFW default outgoing allow' "$( [[ "$default_out" == 'allow (outgoing)' ]] && echo PASS || echo FAIL )" "${default_out:-unknown}"
  session_port=""
  if [[ -n "${SSH_CONNECTION:-}" ]]; then read -r _ _ _ session_port <<<"${SSH_CONNECTION}"; fi
  ssh_port="${1:-${session_port:-$(sudo sshd -T 2>/dev/null | awk '$1 == "port" {print $2; exit}')}}"
  if [[ ! "$ssh_port" =~ ^[0-9]+$ ]]; then ssh_port=22; fi
  allowed_rules="$(printf '%s\n' "$ufw_output" | awk '/ALLOW IN/ {print $1}' | sed 's|/v[46]$||' | sort -u | tr '\n' ' ' | xargs)"
  expected_rules="${ssh_port}/tcp 443/tcp"
  [[ "${TRACKFLOW_ALLOW_HTTP:-0}" == 1 ]] && expected_rules+=" 80/tcp"
  sorted_actual="$(printf '%s\n' "$allowed_rules" | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs)"
  sorted_expected="$(printf '%s\n' "$expected_rules" | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs)"
  check 'UFW allowed ingress ports' "$( [[ "$sorted_actual" == "$sorted_expected" ]] && echo PASS || echo FAIL )" "actual=${allowed_rules:-none}; expected=${sorted_expected}"
else
  check 'UFW installed' FAIL 'ufw not found'
fi

if id trackflow-ops >/dev/null 2>&1; then
  ops_shell="$(getent passwd trackflow-ops | cut -d: -f7)"
  ops_groups="$(id -nG trackflow-ops)"
  check 'trackflow-ops operator account' "$( [[ "$ops_shell" == /bin/bash && " $ops_groups " == *' sudo '* ]] && echo PASS || echo FAIL )" "shell=${ops_shell:-unknown}; groups=${ops_groups:-unknown}"
  if [[ -f /home/trackflow-ops/.ssh/authorized_keys ]]; then
    metadata="$(stat -c '%U:%G %a' /home/trackflow-ops/.ssh/authorized_keys)"
    check 'Operator authorized_keys mode' "$( [[ "$metadata" == 'trackflow-ops:trackflow-ops 600' ]] && echo PASS || echo FAIL )" "$metadata"
  else
    check 'Operator authorized_keys mode' FAIL 'missing'
  fi
  if [[ -d /home/trackflow-ops/.ssh ]]; then
    metadata="$(stat -c '%U:%G %a' /home/trackflow-ops/.ssh)"
    check 'Operator .ssh directory mode' "$( [[ "$metadata" == 'trackflow-ops:trackflow-ops 700' ]] && echo PASS || echo FAIL )" "$metadata"
  else
    check 'Operator .ssh directory mode' FAIL 'missing'
  fi
else
  check 'trackflow-ops operator account' FAIL 'account not found'
fi

if id trackflow-svc >/dev/null 2>&1; then
  shell="$(getent passwd trackflow-svc | cut -d: -f7)"
  check 'trackflow-svc service account' "$( [[ "$shell" == */nologin ]] && echo PASS || echo FAIL )" "shell=${shell:-unknown}"
  id trackflow-svc | sed 's/^/  /'
else
  check 'trackflow-svc service account' FAIL 'account not found'
fi

for path in /var/lib/trackflow /opt/trackflow /etc/trackflow /var/log/trackflow; do
  if [[ -d "$path" ]]; then
    metadata="$(stat -c '%U:%G %a' "$path")"
    expected="trackflow-svc:trackflow-svc 750"
    [[ "$path" == /opt/trackflow || "$path" == /etc/trackflow ]] && expected="root:trackflow-svc 750"
    check "Directory ${path}" "$( [[ "$metadata" == "$expected" ]] && echo PASS || echo FAIL )" "$metadata"
  else
    check "Directory ${path}" FAIL 'missing'
  fi
done

if systemctl is-active --quiet docker 2>/dev/null; then
  check 'Docker UFW bypass review' FAIL 'Docker active; inspect DOCKER-USER/provider firewall policy'
  if command -v iptables >/dev/null 2>&1; then
    sudo iptables -S DOCKER-USER 2>/dev/null | sed 's/^/  /' || true
  fi
else
  check 'Docker UFW bypass review' PASS 'Docker daemon inactive'
fi

printf '\nResult: %s (%s failed checks)\n' "$([[ "$failures" -eq 0 ]] && echo PASS || echo REVIEW_REQUIRED)" "$failures"
exit "$([[ "$failures" -eq 0 ]] && echo 0 || echo 1)"
