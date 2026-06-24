# Autofreak Website – Setup Anleitung

## 1. Supabase einrichten (kostenlos)

1. Gehe zu https://supabase.com → "Start for free"
2. Erstelle ein Konto und ein neues Projekt (z.B. "autofreak")
3. Warte bis das Projekt bereit ist (~1 Minute)

### API Keys holen

- Gehe zu **Settings → API**
- Kopiere **Project URL** und **anon public key**
- Trage sie in `js/config.js` ein:

```js
const SUPABASE_URL = 'https://deinprojekt.supabase.co';
const SUPABASE_ANON_KEY = 'dein-langer-key-hier';
```

### Datenbank-Tabellen erstellen

Gehe in Supabase zu **SQL Editor** und führe diesen Code aus:

```sql
create table appointments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  service text not null,
  date date not null,
  car text,
  notes text,
  status text default 'pending'
);

create table contact_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  message text not null
);

alter table appointments enable row level security;
alter table contact_messages enable row level security;

create policy "Jeder kann Termin anlegen" on appointments for insert with check (true);
create policy "Eigene Termine sehen" on appointments for select using (auth.uid() = user_id);
create policy "Eigene Termine updaten" on appointments for update using (auth.uid() = user_id);
create policy "Kontakt senden" on contact_messages for insert with check (true);
```

---

## 2. Website hosten (kostenlos mit Netlify)

1. Gehe zu https://netlify.com → "Sign up"
2. Klicke auf **"Add new site → Import from Git"**
3. Verbinde dein GitHub-Repo (julixxn/autodetailing)
4. Deploy Einstellungen:
   - **Build command:** leer lassen
   - **Publish directory:** `.`
5. Klicke **Deploy**

→ Du bekommst sofort eine URL wie `autofreak.netlify.app`

### Eigene Domain

In Netlify → **Domain Settings → Add custom domain**
z.B. `autofreak.at` (Domain kostet ~10€/Jahr)

---

## 3. Fotos hinzufügen

Lege Fotos im `img/` Ordner ab und tausche in `index.html` die Platzhalter aus:

```html
<!-- Vorher (Platzhalter): -->
<div class="gallery-placeholder"><span>📸</span></div>

<!-- Nachher (echtes Foto): -->
<img src="img/dein-foto.jpg" alt="Ergebnis" style="width:100%;height:100%;object-fit:cover;">
```

---

## 4. Inhalte anpassen

- Preise → in `index.html` nach `ab €` suchen
- Telefonnummer → nach `+43 XXX` suchen
- E-Mail → `info@autofreak.at` ändern
- Öffnungszeiten → nach `Mo–Sa` suchen
