const { ensureUsersTable, sql, verifyPassword, signToken, isValidEmail } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
    return;
  }

  try {
    await ensureUsersTable();

    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      res.status(400).json({ ok: false, error: 'Email et mot de passe sont obligatoires.' });
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ ok: false, error: "Cet email n'est pas valide." });
      return;
    }

    const result = await sql`
      SELECT id, email, name, phone, password_hash, salt
      FROM users WHERE email = ${cleanEmail} LIMIT 1;
    `;

    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Aucun compte n'existe avec cet email. Crée un compte." });
      return;
    }

    const user = result.rows[0];
    const valid = verifyPassword(String(password), user.salt, user.password_hash);
    if (!valid) {
      res.status(401).json({ ok: false, error: 'Mot de passe incorrect.' });
      return;
    }

    const token = signToken({ uid: user.id, email: user.email, iat: Date.now() });

    res.status(200).json({
      ok: true,
      token,
      user: { name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur, réessaie dans un instant." });
  }
};
