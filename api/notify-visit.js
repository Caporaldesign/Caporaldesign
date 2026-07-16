// api/notify-visit.js
// Fonction serverless Vercel : reçoit un message du site (index.html) et
// le transmet à CallMeBot pour t'envoyer une notification WhatsApp.
// La clé CallMeBot et ton numéro restent ici, côté serveur — jamais
// visibles dans le code source que voient tes visiteurs.
//
// À FAIRE UNE SEULE FOIS SUR VERCEL :
// 1. Va dans ton projet Vercel → Settings → Environment Variables
// 2. Ajoute :
//    - CALLMEBOT_PHONE = ton numéro WhatsApp (ex: 2250747626380, sans le +)
//    - CALLMEBOT_KEY   = ta clé API CallMeBot
// 3. Redéploie le site pour que les variables soient prises en compte.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const phone = process.env.CALLMEBOT_PHONE;
  const key = process.env.CALLMEBOT_KEY;

  if (!phone || !key) {
    // Pas configuré sur Vercel : on ne bloque pas le site, on répond juste
    // que la notification n'a pas pu partir.
    return res.status(200).json({ sent: false, reason: 'CALLMEBOT_PHONE ou CALLMEBOT_KEY manquant côté serveur' });
  }

  const message = (req.body && req.body.message) ? String(req.body.message).slice(0, 500) : 'Visite sur le site';

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(key)}`;
    const cmbRes = await fetch(url);
    const ok = cmbRes.ok;
    return res.status(200).json({ sent: ok });
  } catch (err) {
    return res.status(200).json({ sent: false, reason: 'Erreur réseau vers CallMeBot' });
  }
}
