-- whatsapp_notifications.status hoje só grava se a Meta ACEITOU o envio
-- (sent/failed no fetch da Graph API). Isso não é o mesmo que ENTREGA no
-- aparelho -- a Meta manda isso depois, de forma assíncrona, via webhook de
-- status (sent/delivered/read/failed) correlacionado pelo wamid (id da
-- mensagem retornado no envio). O whatsapp-webhook existia só como stub,
-- sem gravar nada. Achado 2026-08-22: template aceito (200 OK) mas nada
-- chegou no aparelho -- sem isso não dava pra saber se é entrega real ou não.
alter table whatsapp_notifications
  add column if not exists wamid text,
  add column if not exists delivery_status text,
  add column if not exists delivery_error text,
  add column if not exists delivery_status_at timestamptz;

create unique index if not exists whatsapp_notifications_wamid_idx
  on whatsapp_notifications(wamid) where wamid is not null;
