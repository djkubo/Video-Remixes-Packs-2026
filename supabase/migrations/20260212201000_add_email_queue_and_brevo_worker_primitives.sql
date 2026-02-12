begin;

-- =========================================================
-- 1) TABLAS DE EVENTOS DE PEDIDO + COLA DE EMAIL
-- =========================================================

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'lead_received',
      'payment_confirmed',
      'shipping_updated',
      'manual_status_change'
    )
  ),
  event_source text not null default 'system',
  event_key text unique,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.outbound_email_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  email_to text not null check (email_to ~* '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'),
  template_key text not null,
  template_lang text not null default 'es' check (template_lang in ('es', 'en')),
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'sent', 'failed', 'cancelled')
  ),
  provider text,
  provider_message_id text,
  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 5 check (max_retries between 1 and 20),
  next_retry_at timestamptz not null default now(),
  last_error text,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.email_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.outbound_email_queue(id) on delete cascade,
  provider text,
  attempt_no integer not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  response_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_lead_created
  on public.order_events(lead_id, created_at desc);

create index if not exists idx_order_events_type_created
  on public.order_events(event_type, created_at desc);

create index if not exists idx_outbound_email_queue_status_next_retry
  on public.outbound_email_queue(status, next_retry_at, created_at);

create index if not exists idx_outbound_email_queue_lead_created
  on public.outbound_email_queue(lead_id, created_at desc);

create index if not exists idx_email_delivery_attempts_queue_created
  on public.email_delivery_attempts(queue_id, created_at desc);

-- =========================================================
-- 2) TRIGGER updated_at
-- =========================================================

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_outbound_email_queue_updated_at on public.outbound_email_queue;
create trigger trg_outbound_email_queue_updated_at
before update on public.outbound_email_queue
for each row execute function public.set_row_updated_at();

-- =========================================================
-- 3) RLS (solo admins en panel)
-- =========================================================

alter table public.order_events enable row level security;
alter table public.outbound_email_queue enable row level security;
alter table public.email_delivery_attempts enable row level security;

drop policy if exists "Admins can read order_events" on public.order_events;
drop policy if exists "Admins can manage order_events" on public.order_events;
create policy "Admins can read order_events"
on public.order_events
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage order_events"
on public.order_events
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read outbound_email_queue" on public.outbound_email_queue;
drop policy if exists "Admins can manage outbound_email_queue" on public.outbound_email_queue;
create policy "Admins can read outbound_email_queue"
on public.outbound_email_queue
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage outbound_email_queue"
on public.outbound_email_queue
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read email_delivery_attempts" on public.email_delivery_attempts;
drop policy if exists "Admins can manage email_delivery_attempts" on public.email_delivery_attempts;
create policy "Admins can read email_delivery_attempts"
on public.email_delivery_attempts
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage email_delivery_attempts"
on public.email_delivery_attempts
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 4) HELPER: ENCOLAR EMAIL PARA LEAD
-- =========================================================

create or replace function public.queue_email_for_lead(
  p_lead_id uuid,
  p_template_key text,
  p_subject text,
  p_payload jsonb default '{}'::jsonb,
  p_lang text default 'es',
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_job_id uuid;
  v_lang text;
  v_dedupe text;
begin
  select l.email into v_email
  from public.leads l
  where l.id = p_lead_id;

  if v_email is null then
    raise exception 'Lead % not found or without email', p_lead_id;
  end if;

  v_lang := case when lower(coalesce(p_lang, 'es')) = 'en' then 'en' else 'es' end;
  v_dedupe := coalesce(
    p_dedupe_key,
    format('lead:%s:%s', p_lead_id::text, p_template_key)
  );

  insert into public.outbound_email_queue (
    lead_id, email_to, template_key, template_lang, subject, payload, dedupe_key
  )
  values (
    p_lead_id, lower(trim(v_email)), p_template_key, v_lang, p_subject, coalesce(p_payload, '{}'::jsonb), v_dedupe
  )
  on conflict (dedupe_key) do nothing
  returning id into v_job_id;

  if v_job_id is null then
    select q.id into v_job_id
    from public.outbound_email_queue q
    where q.dedupe_key = v_dedupe;
  end if;

  return v_job_id;
end;
$$;

-- =========================================================
-- 5) TRIGGER LEADS => EVENTOS + EMAILS (confirmación y shipping)
-- =========================================================

create or replace function public.trg_leads_lifecycle_queue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lang text;
  v_payment_key text;
  v_shipping_key text;
begin
  v_lang := case
    when coalesce(new.source_page, '') ilike '/en%' then 'en'
    else 'es'
  end;

  -- INSERT => recibimos tu solicitud
  if tg_op = 'INSERT' then
    perform public.queue_email_for_lead(
      new.id,
      'lead_received',
      case when v_lang = 'es' then 'Recibimos tu solicitud' else 'We received your request' end,
      jsonb_build_object(
        'lead_id', new.id,
        'name', new.name,
        'source', coalesce(new.source, 'unknown')
      ),
      v_lang,
      format('lead:%s:lead_received', new.id::text)
    );

    insert into public.order_events (
      lead_id, event_type, event_source, event_key, event_payload
    )
    values (
      new.id,
      'lead_received',
      'db_trigger',
      format('lead:%s:lead_received', new.id::text),
      jsonb_build_object('source', new.source)
    )
    on conflict (event_key) do nothing;

    -- Si ya entra pagado, también encola confirmación
    if new.paid_at is not null then
      v_payment_key := format(
        'lead:%s:payment:%s',
        new.id::text,
        coalesce(new.payment_id, to_char(new.paid_at at time zone 'utc', 'YYYYMMDDHH24MISS'))
      );

      perform public.queue_email_for_lead(
        new.id,
        'payment_confirmed',
        case when v_lang = 'es' then 'Pago confirmado' else 'Payment confirmed' end,
        jsonb_build_object(
          'lead_id', new.id,
          'name', new.name,
          'payment_provider', new.payment_provider,
          'payment_id', new.payment_id,
          'paid_at', new.paid_at
        ),
        v_lang,
        v_payment_key
      );

      insert into public.order_events (
        lead_id, event_type, event_source, event_key, event_payload
      )
      values (
        new.id,
        'payment_confirmed',
        'db_trigger',
        v_payment_key,
        jsonb_build_object(
          'payment_provider', new.payment_provider,
          'payment_id', new.payment_id,
          'paid_at', new.paid_at
        )
      )
      on conflict (event_key) do nothing;
    end if;

    -- Si ya entra con shipping, encola update
    if new.shipping_status is not null
       or new.shipping_tracking_number is not null
       or new.shipping_label_url is not null then
      v_shipping_key := format(
        'lead:%s:shipping:%s:%s',
        new.id::text,
        coalesce(new.shipping_status, 'na'),
        coalesce(new.shipping_tracking_number, 'na')
      );

      perform public.queue_email_for_lead(
        new.id,
        'shipping_update',
        case when v_lang = 'es' then 'Actualización de envío' else 'Shipping update' end,
        jsonb_build_object(
          'lead_id', new.id,
          'name', new.name,
          'shipping_status', new.shipping_status,
          'shipping_tracking_number', new.shipping_tracking_number,
          'shipping_label_url', new.shipping_label_url,
          'shipping_carrier', new.shipping_carrier
        ),
        v_lang,
        v_shipping_key
      );

      insert into public.order_events (
        lead_id, event_type, event_source, event_key, event_payload
      )
      values (
        new.id,
        'shipping_updated',
        'db_trigger',
        v_shipping_key,
        jsonb_build_object(
          'shipping_status', new.shipping_status,
          'shipping_tracking_number', new.shipping_tracking_number,
          'shipping_label_url', new.shipping_label_url,
          'shipping_carrier', new.shipping_carrier
        )
      )
      on conflict (event_key) do nothing;
    end if;

    return new;
  end if;

  -- UPDATE => pago confirmado
  if new.paid_at is not null
     and (old.paid_at is null or old.paid_at is distinct from new.paid_at) then
    v_payment_key := format(
      'lead:%s:payment:%s',
      new.id::text,
      coalesce(new.payment_id, to_char(new.paid_at at time zone 'utc', 'YYYYMMDDHH24MISS'))
    );

    perform public.queue_email_for_lead(
      new.id,
      'payment_confirmed',
      case when v_lang = 'es' then 'Pago confirmado' else 'Payment confirmed' end,
      jsonb_build_object(
        'lead_id', new.id,
        'name', new.name,
        'payment_provider', new.payment_provider,
        'payment_id', new.payment_id,
        'paid_at', new.paid_at
      ),
      v_lang,
      v_payment_key
    );

    insert into public.order_events (
      lead_id, event_type, event_source, event_key, event_payload
    )
    values (
      new.id,
      'payment_confirmed',
      'db_trigger',
      v_payment_key,
      jsonb_build_object(
        'payment_provider', new.payment_provider,
        'payment_id', new.payment_id,
        'paid_at', new.paid_at
      )
    )
    on conflict (event_key) do nothing;
  end if;

  -- UPDATE => shipping cambió
  if (
      new.shipping_status is distinct from old.shipping_status
      or new.shipping_tracking_number is distinct from old.shipping_tracking_number
      or new.shipping_label_url is distinct from old.shipping_label_url
    )
    and (
      new.shipping_status is not null
      or new.shipping_tracking_number is not null
      or new.shipping_label_url is not null
    ) then
    v_shipping_key := format(
      'lead:%s:shipping:%s:%s',
      new.id::text,
      coalesce(new.shipping_status, 'na'),
      coalesce(new.shipping_tracking_number, 'na')
    );

    perform public.queue_email_for_lead(
      new.id,
      'shipping_update',
      case when v_lang = 'es' then 'Actualización de envío' else 'Shipping update' end,
      jsonb_build_object(
        'lead_id', new.id,
        'name', new.name,
        'shipping_status', new.shipping_status,
        'shipping_tracking_number', new.shipping_tracking_number,
        'shipping_label_url', new.shipping_label_url,
        'shipping_carrier', new.shipping_carrier
      ),
      v_lang,
      v_shipping_key
    );

    insert into public.order_events (
      lead_id, event_type, event_source, event_key, event_payload
    )
    values (
      new.id,
      'shipping_updated',
      'db_trigger',
      v_shipping_key,
      jsonb_build_object(
        'shipping_status', new.shipping_status,
        'shipping_tracking_number', new.shipping_tracking_number,
        'shipping_label_url', new.shipping_label_url,
        'shipping_carrier', new.shipping_carrier
      )
    )
    on conflict (event_key) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_leads_lifecycle_queue on public.leads;
create trigger trg_leads_lifecycle_queue
after insert or update of
  paid_at,
  payment_id,
  payment_provider,
  shipping_status,
  shipping_tracking_number,
  shipping_label_url,
  shipping_carrier
on public.leads
for each row
execute function public.trg_leads_lifecycle_queue();

-- =========================================================
-- 6) RPC PARA WORKER DE EMAIL (Edge Function)
-- =========================================================

create or replace function public.claim_email_jobs(p_limit integer default 25)
returns setof public.outbound_email_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select q.id
    from public.outbound_email_queue q
    where q.status = 'pending'
      and q.next_retry_at <= now()
    order by q.created_at asc
    limit greatest(1, least(p_limit, 200))
    for update skip locked
  )
  update public.outbound_email_queue q
  set status = 'processing',
      updated_at = now()
  from picked
  where q.id = picked.id
  returning q.*;
end;
$$;

create or replace function public.mark_email_job_sent(
  p_job_id uuid,
  p_provider text,
  p_provider_message_id text default null,
  p_response jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_no integer;
begin
  update public.outbound_email_queue q
  set status = 'sent',
      provider = p_provider,
      provider_message_id = p_provider_message_id,
      sent_at = now(),
      last_error = null,
      updated_at = now()
  where q.id = p_job_id;

  select coalesce(retry_count, 0) + 1 into v_attempt_no
  from public.outbound_email_queue
  where id = p_job_id;

  if v_attempt_no is null then
    return;
  end if;

  insert into public.email_delivery_attempts (
    queue_id, provider, attempt_no, status, response_payload
  )
  values (
    p_job_id, p_provider, v_attempt_no, 'sent', coalesce(p_response, '{}'::jsonb)
  );
end;
$$;

create or replace function public.mark_email_job_failed(
  p_job_id uuid,
  p_error text,
  p_provider text default null,
  p_retry_delay_minutes integer default 15,
  p_response jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_no integer;
  v_provider text;
begin
  update public.outbound_email_queue q
  set retry_count = q.retry_count + 1,
      status = case
        when q.retry_count + 1 >= q.max_retries then 'failed'
        else 'pending'
      end,
      next_retry_at = case
        when q.retry_count + 1 >= q.max_retries then q.next_retry_at
        else now() + make_interval(
          mins => (
            greatest(1, coalesce(p_retry_delay_minutes, 15))
            * power(2, least(q.retry_count, 6))::int
          )
        )
      end,
      last_error = left(coalesce(p_error, 'unknown error'), 2000),
      provider = coalesce(p_provider, q.provider),
      updated_at = now()
  where q.id = p_job_id;

  select retry_count, provider
    into v_attempt_no, v_provider
  from public.outbound_email_queue
  where id = p_job_id;

  if v_attempt_no is null then
    return;
  end if;

  insert into public.email_delivery_attempts (
    queue_id, provider, attempt_no, status, error_message, response_payload
  )
  values (
    p_job_id, coalesce(v_provider, p_provider), v_attempt_no, 'failed',
    left(coalesce(p_error, 'unknown error'), 2000),
    coalesce(p_response, '{}'::jsonb)
  );
end;
$$;

-- Solo service_role debe ejecutar estos RPC
revoke all on function public.queue_email_for_lead(uuid, text, text, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.claim_email_jobs(integer) from public, anon, authenticated;
revoke all on function public.mark_email_job_sent(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.mark_email_job_failed(uuid, text, text, integer, jsonb) from public, anon, authenticated;

grant execute on function public.queue_email_for_lead(uuid, text, text, jsonb, text, text) to service_role;
grant execute on function public.claim_email_jobs(integer) to service_role;
grant execute on function public.mark_email_job_sent(uuid, text, text, jsonb) to service_role;
grant execute on function public.mark_email_job_failed(uuid, text, text, integer, jsonb) to service_role;

-- =========================================================
-- 7) VISTAS DE MONITOREO
-- =========================================================

create or replace view public.email_queue_daily_summary
with (security_invoker = true) as
select
  date(created_at) as day,
  template_key,
  status,
  count(*) as total
from public.outbound_email_queue
group by 1,2,3
order by 1 desc, 2, 3;

create or replace view public.order_events_daily_summary
with (security_invoker = true) as
select
  date(created_at) as day,
  event_type,
  count(*) as total
from public.order_events
group by 1,2
order by 1 desc, 2;

-- =========================================================
-- 8) BACKFILL OPCIONAL (pagos previos y shipping ya creado)
-- =========================================================

insert into public.outbound_email_queue (
  lead_id, email_to, template_key, template_lang, subject, payload, dedupe_key
)
select
  l.id,
  lower(trim(l.email)),
  'payment_confirmed',
  case when coalesce(l.source_page, '') ilike '/en%' then 'en' else 'es' end,
  case when coalesce(l.source_page, '') ilike '/en%' then 'Payment confirmed' else 'Pago confirmado' end,
  jsonb_build_object(
    'lead_id', l.id,
    'name', l.name,
    'payment_provider', l.payment_provider,
    'payment_id', l.payment_id,
    'paid_at', l.paid_at
  ),
  format(
    'lead:%s:payment:%s',
    l.id::text,
    coalesce(l.payment_id, to_char(l.paid_at at time zone 'utc', 'YYYYMMDDHH24MISS'))
  )
from public.leads l
where l.paid_at is not null
on conflict (dedupe_key) do nothing;

insert into public.outbound_email_queue (
  lead_id, email_to, template_key, template_lang, subject, payload, dedupe_key
)
select
  l.id,
  lower(trim(l.email)),
  'shipping_update',
  case when coalesce(l.source_page, '') ilike '/en%' then 'en' else 'es' end,
  case when coalesce(l.source_page, '') ilike '/en%' then 'Shipping update' else 'Actualización de envío' end,
  jsonb_build_object(
    'lead_id', l.id,
    'name', l.name,
    'shipping_status', l.shipping_status,
    'shipping_tracking_number', l.shipping_tracking_number,
    'shipping_label_url', l.shipping_label_url,
    'shipping_carrier', l.shipping_carrier
  ),
  format(
    'lead:%s:shipping:%s:%s',
    l.id::text,
    coalesce(l.shipping_status, 'na'),
    coalesce(l.shipping_tracking_number, 'na')
  )
from public.leads l
where l.shipping_status is not null
   or l.shipping_tracking_number is not null
   or l.shipping_label_url is not null
on conflict (dedupe_key) do nothing;

commit;
