// AUTOFREAK – Haupt-App Logik

let currentUser = null;
let currentLang = 'de';
let userAppointments = [];

document.addEventListener('DOMContentLoaded', async () => {
  initDateMin();
  setupScrollListener();
  setupForms();
  await checkAuthState();
});

function initDateMin() {
  const dateInput = document.getElementById('bookDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
}

function setupScrollListener() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function scrollToBooking() {
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('burgerBtn').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.add('open');
});
document.getElementById('mobileClose').addEventListener('click', closeMobile);
function closeMobile() { document.getElementById('mobileMenu').classList.remove('open'); }

document.getElementById('langToggle').addEventListener('click', () => {
  currentLang = currentLang === 'de' ? 'en' : 'de';
  document.getElementById('langToggle').textContent = currentLang === 'de' ? 'EN' : 'DE';
  applyTranslations();
});

function applyTranslations() {
  document.querySelectorAll('[data-de]').forEach(el => {
    const text = el.getAttribute('data-' + currentLang);
    if (text) el.textContent = text;
  });
}

async function checkAuthState() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) onUserLoggedIn(session.user);
  } catch (e) {
    console.log('Demo-Modus: Supabase nicht konfiguriert.');
  }
}

function onUserLoggedIn(user) {
  currentUser = user;
  const name = user.user_metadata?.name || user.email.split('@')[0];
  const authBtn = document.getElementById('navAuthBtn');
  authBtn.textContent = 'Mein Bereich';
  authBtn.onclick = openDashboard;
  document.getElementById('dashWelcome').innerHTML = 'Hallo, <strong>' + name + '</strong>';
  loadUserAppointments();
}

function onUserLoggedOut() {
  currentUser = null;
  const authBtn = document.getElementById('navAuthBtn');
  authBtn.textContent = currentLang === 'de' ? 'Anmelden' : 'Sign In';
  authBtn.onclick = openAuth;
}

function openAuth() { document.getElementById('authModal').classList.add('open'); switchTab('login'); }
function closeAuth() { document.getElementById('authModal').classList.remove('open'); }
document.getElementById('authModal').addEventListener('click', function(e) { if (e.target === this) closeAuth(); });

function switchTab(tab) {
  document.getElementById('formLogin').classList.toggle('active', tab === 'login');
  document.getElementById('formRegister').classList.toggle('active', tab === 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('modalTitle').textContent = tab === 'login'
    ? (currentLang === 'de' ? 'Willkommen zurück' : 'Welcome back')
    : (currentLang === 'de' ? 'Konto erstellen' : 'Create Account');
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msgEl = document.getElementById('loginMsg');
  if (!email || !password) { showFormMsg(msgEl, 'Bitte fülle alle Felder aus.', 'error'); return; }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showFormMsg(msgEl, '✓ Erfolgreich angemeldet!', 'success');
    setTimeout(() => { closeAuth(); onUserLoggedIn(data.user); openDashboard(); }, 800);
  } catch (error) {
    showFormMsg(msgEl, 'E-Mail oder Passwort falsch. (Oder Supabase noch nicht konfiguriert.)', 'error');
  }
}

async function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const msgEl = document.getElementById('registerMsg');
  if (!name || !email || !password) { showFormMsg(msgEl, 'Bitte fülle alle Felder aus.', 'error'); return; }
  if (password.length < 8) { showFormMsg(msgEl, 'Passwort muss mindestens 8 Zeichen haben.', 'error'); return; }
  try {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    showFormMsg(msgEl, '✓ Konto erstellt! Bitte bestätige deine E-Mail-Adresse.', 'success');
  } catch (error) {
    showFormMsg(msgEl, 'Fehler beim Registrieren. Ist Supabase konfiguriert?', 'error');
  }
}

async function handleLogout() {
  try { await supabase.auth.signOut(); } catch (e) {}
  closeDashboard();
  onUserLoggedOut();
  showToast('Erfolgreich abgemeldet.');
}

function openDashboard() {
  document.getElementById('dashboard').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (currentUser) loadUserAppointments();
}

function closeDashboard() {
  document.getElementById('dashboard').classList.remove('open');
  document.body.style.overflow = '';
}

async function loadUserAppointments() {
  if (!currentUser) return;
  try {
    const { data, error } = await supabase.from('appointments').select('*').eq('user_id', currentUser.id).order('date', { ascending: true });
    if (error) throw error;
    userAppointments = data || [];
  } catch (e) {
    userAppointments = [];
  }
  renderAppointments();
}

function renderAppointments() {
  const list = document.getElementById('appointmentList');
  const pending = userAppointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const completed = userAppointments.filter(a => a.status === 'completed');
  document.getElementById('dashPending').textContent = pending.length;
  document.getElementById('dashCompleted').textContent = completed.length;
  const upcoming = userAppointments.find(a => a.status !== 'completed' && new Date(a.date) >= new Date());
  document.getElementById('dashNextApt').textContent = upcoming ? formatDate(upcoming.date) : 'Kein Termin';
  if (userAppointments.length === 0) {
    list.innerHTML = '<div class="no-appointments"><p>Noch keine Termine vorhanden.</p><button class="btn btn-gold" style="margin-top:1rem;padding:0.7rem 1.5rem;" onclick="closeDashboard(); scrollToBooking();">Jetzt Termin buchen</button></div>';
    return;
  }
  const labels = { innen_basic: 'Innenreinigung Basic', innen_premium: 'Innenreinigung Premium', aussen: 'Außenwäsche & Politur', keramik: 'Keramikversiegelung', kratzer: 'Kratzer & Delle', komplett: 'Komplett-Paket' };
  list.innerHTML = userAppointments.map(apt => `
    <div class="appointment-item">
      <div><div class="apt-service">${labels[apt.service] || apt.service}</div><div class="apt-date">${formatDate(apt.date)} · ${apt.car || ''}</div></div>
      <div style="display:flex;align-items:center;gap:1rem;">
        <span class="apt-status ${apt.status === 'confirmed' ? 'confirmed' : 'pending'}">${apt.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}</span>
        ${apt.status !== 'completed' ? `<button class="apt-cancel" onclick="cancelAppointment('${apt.id}')">Stornieren</button>` : ''}
      </div>
    </div>`).join('');
}

async function cancelAppointment(id) {
  if (!confirm('Termin wirklich stornieren?')) return;
  try {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    showToast('Termin storniert.');
    loadUserAppointments();
  } catch (e) {
    showToast('Fehler beim Stornieren.', true);
  }
}

function setupForms() {
  document.getElementById('bookingForm').addEventListener('submit', handleBooking);
  document.getElementById('contactForm').addEventListener('submit', handleContact);
}

async function handleBooking(e) {
  e.preventDefault();
  const msgEl = document.getElementById('bookingMsg');
  const btn = e.target.querySelector('button[type="submit"]');
  const data = {
    first_name: document.getElementById('bookFirstName').value.trim(),
    last_name: document.getElementById('bookLastName').value.trim(),
    email: document.getElementById('bookEmail').value.trim(),
    phone: document.getElementById('bookPhone').value.trim(),
    service: document.getElementById('bookService').value,
    date: document.getElementById('bookDate').value,
    car: document.getElementById('bookCar').value.trim(),
    notes: document.getElementById('bookNotes').value.trim(),
    status: 'pending',
    user_id: currentUser?.id || null,
  };
  if (!data.service || !data.date) { showFormMsg(msgEl, 'Bitte wähle eine Leistung und ein Datum.', 'error'); return; }
  btn.textContent = 'Wird gesendet...';
  btn.disabled = true;
  try {
    const { error } = await supabase.from('appointments').insert([data]);
    if (error) throw error;
    showFormMsg(msgEl, '✓ Deine Anfrage wurde gesendet! Wir melden uns bald.', 'success');
    e.target.reset();
    if (currentUser) loadUserAppointments();
  } catch (err) {
    showFormMsg(msgEl, '✓ Demo: Anfrage empfangen! (Supabase noch nicht konfiguriert)', 'success');
    e.target.reset();
  }
  btn.textContent = 'Termin anfragen';
  btn.disabled = false;
}

async function handleContact(e) {
  e.preventDefault();
  const msgEl = document.getElementById('contactMsg');
  try {
    await supabase.from('contact_messages').insert([{ name: document.getElementById('cName').value.trim(), email: document.getElementById('cEmail').value.trim(), message: document.getElementById('cMessage').value.trim() }]);
  } catch (err) {}
  showFormMsg(msgEl, '✓ Nachricht gesendet! Wir antworten so schnell wie möglich.', 'success');
  e.target.reset();
}

function showFormMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg-box ' + type + ' show';
  setTimeout(() => el.classList.remove('show'), 5000);
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.borderLeftColor = isError ? '#DC2626' : 'var(--gold)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(currentLang === 'de' ? 'de-AT' : 'en-GB', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}