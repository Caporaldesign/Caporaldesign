const { ensureUsersTable, sql, verifyToken } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
    return;
  }

  try {
    await ensureUsersTable();

    const { token, name, phone } = req.body || {};
    const payload = verifyToken(token);
    if (!payload || !payload.uid) {
      res.status(401).json({ ok: false, error: 'Session invalide, reconnecte-toi.' });
      return;
    }

    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    if (!cleanName) {
      res.status(400).json({ ok: false, error: 'Le nom est obligatoire.' });
      return;
    }

    const updated = await sql`
      UPDATE users SET name = ${cleanName}, phone = ${cleanPhone}
      WHERE id = ${payload.uid}
      RETURNING email, name, phone;
    `;

    if (updated.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Compte introuvable.' });
      return;
    }

    res.status(200).json({ ok: true, user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur, réessaie dans un instant." });
  }
};
