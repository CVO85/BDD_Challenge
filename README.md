# Challenge CO – Site organisateurs

## 1. Google (compte de service)
1. console.cloud.google.com → nouveau projet → activer « Google Sheets API ».
2. IAM → Comptes de service → créer → Clés → ajouter une clé JSON (télécharger).
3. Dans le Sheet : Partager → adresse `client_email` du compte, rôle **Lecteur**. Ne PAS partager publiquement le fichier.

## 2. Brevo (envoi des mails, sans nom de domaine)
1. Créer un compte gratuit sur brevo.com (300 mails/jour).
2. Expéditeurs, domaines & IP → Expéditeurs → ajouter l'adresse du challenge et valider le mail de confirmation. `MAIL_FROM` = cette adresse.
3. SMTP & API → Clés API → créer une clé (`BREVO_API_KEY`).
4. Tester l'envoi du lien de connexion et vérifier les spams : sans domaine propre, la délivrabilité peut être moins bonne.

## 3. Netlify
Dépôt Git PRIVÉ (sans aucune donnée) → Netlify « Import project ». Variables d'environnement (Site settings) :
| Variable | Valeur |
|---|---|
| GOOGLE_SERVICE_ACCOUNT | contenu complet du JSON (une ligne) |
| SHEET_ID | identifiant dans l'URL du Sheet |
| SHEET_TAB | nom de l'onglet (défaut `Feuil1`) |
| SESSION_SECRET | chaîne aléatoire 64+ car. (`openssl rand -hex 48`) |
| ORGANISATEURS | emails autorisés, séparés par des virgules |
| CHALLENGE_EMAIL | adresse qui reçoit les corrections |
| BREVO_API_KEY | clé API Brevo |
| MAIL_FROM | adresse expéditeur validée dans Brevo |
| SITE_URL | `https://votre-site.netlify.app` (sans slash final) |

Ajouter/retirer un organisateur = modifier `ORGANISATEURS` puis redéployer. Les journaux (connexions, consultations de contacts, corrections) sont dans Netlify → Logs → Functions.

## Limites connues
- Lien magique valable 15 min mais non invalidé après usage (pas de stockage). Pour l'usage unique strict, ajouter Netlify Blobs.
- Limitation de débit en mémoire (par instance) : suffisant à cette échelle.
- Les logs gratuits Netlify sont conservés peu de temps.
