const { ensureUsersTable, sql, hashPassword, makeSalt, signToken, isValidEmail } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
    return;
  }

  try {
    await ensureUsersTable();

    const { name, email, phone, password } = req.body || {};

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (!cleanName || !cleanEmail || !password) {
      res.status(400).json({ ok: false, error: 'Nom, email et mot de passe sont obligatoires.' });
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ ok: false, error: "Cet email n'est pas valide." });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ ok: false, error: 'Le mot de passe doit faire au moins 6 caractères.' });
      return;
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1;`;
    if (existing.rows.length > 0) {
      res.status(409).json({ ok: false, error: 'Un compte existe déjà avec cet email. Connecte-toi plutôt.' });
      return;
    }

    const salt = makeSalt();
    const passwordHash = hashPassword(String(password), salt);

    const inserted = await sql`
      INSERT INTO users (email, name, phone, password_hash, salt)
      VALUES (${cleanEmail}, ${cleanName}, ${cleanPhone}, ${passwordHash}, ${salt})
      RETURNING id, email, name, phone;
    `;
    const user = inserted.rows[0];

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
