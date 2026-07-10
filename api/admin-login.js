const ADMIN_PASSWORD = "Caporal2026";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 heures

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
    return;
  }

  const { password } = req.body || {};

  if (!password || password !== ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, error: 'Mot de passe incorrect.' });
    return;
  }

  const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
  const expires = Date.now() + SESSION_DURATION_MS;

  res.status(200).json({ ok: true, token, expires });
}

