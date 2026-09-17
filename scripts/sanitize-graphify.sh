#!/usr/bin/env bash
# Remove dados pessoais (e-mails) da saída do graphify antes de commitar.
# Idempotente: pode rodar quantas vezes quiser, inclusive em arquivos já sanitizados.
# Uso: scripts/sanitize-graphify.sh   (rodar depois de toda regeneração do graphify-out/)
set -euo pipefail

cd "$(dirname "$0")/.."

FILES=(
  graphify-out/graph.json
  graphify-out/graph.html
  graphify-out/GRAPH_REPORT.md
)

EMAIL_RE='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'

# Padrões de segredo real (estruturais, não por nome de variável) -- evita falso positivo
# em texto de label tipo "WhatsApp Webhook Verification Token", que não tem "=" nem valor.
SECRET_RE='eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
SECRET_RE+='|sk-[A-Za-z0-9]{20,}'
SECRET_RE+='|AKIA[0-9A-Z]{16}'
SECRET_RE+='|(GROQ_API_KEY|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY|META_[A-Z_]*TOKEN|WHATSAPP_[A-Z_]*TOKEN|R2_[A-Z_]*(KEY|SECRET)|AWS_SECRET_ACCESS_KEY)["'"'"'":= ]+[A-Za-z0-9/+_-]{16,}'

# Telefone BR: +55DDDDDDDDDDD, (DD) 9DDDD-DDDD, DD9DDDDDDDD
PHONE_RE='\+?55[0-9]{10,11}\b|\([0-9]{2}\)[[:space:]]?9?[0-9]{4}-?[0-9]{4}'

echo "== Sanitizando e-mails =="
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  (pulando, não existe: $f)"
    continue
  fi
  before=$(grep -oE "$EMAIL_RE" "$f" | grep -vc '^<email-redacted>$' || true)
  sed -i -E "s/$EMAIL_RE/<email-redacted>/g" "$f"
  after=$(grep -oE "$EMAIL_RE" "$f" | grep -vc '^<email-redacted>$' || true)
  echo "  $f: $before e-mail(s) encontrado(s), $after restante(s) após sanitização"
done

echo "== Verificação final (e-mail, telefone, chave) =="
found=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue

  emails=$(grep -noE "$EMAIL_RE" "$f" | grep -v ':<email-redacted>$' || true)
  if [ -n "$emails" ]; then
    echo "  [EMAIL] $f:"
    echo "$emails" | sed 's/^/    /'
    found=1
  fi

  phones=$(grep -noE "$PHONE_RE" "$f" || true)
  if [ -n "$phones" ]; then
    echo "  [PHONE] $f:"
    echo "$phones" | sed 's/^/    /'
    found=1
  fi

  secrets=$(grep -noE "$SECRET_RE" "$f" || true)
  if [ -n "$secrets" ]; then
    echo "  [SECRET] $f: padrão de segredo encontrado (valor omitido)"
    found=1
  fi
done

if [ "$found" -ne 0 ]; then
  echo "FALHOU: padrão sensível encontrado após sanitização. Não commitar." >&2
  exit 1
fi

echo "OK: nenhum e-mail, telefone ou chave encontrado nos arquivos verificados."
