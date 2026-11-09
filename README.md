# Challenge Vendée Orientation – Site organisateurs

Consultation sécurisée des coureurs : recherche/filtres, signalement d'erreur par mail, statistiques. Connexion nominative par lien magique (email).
Durée du déploiement : ~45 min, sans rien installer. Testez d'abord avec une **copie du Sheet contenant des données fictives**.
Comptes gratuits nécessaires : Google, GitHub, Netlify, Brevo.

## Étape 1 – Préparer le Google Sheet
1. Fichier → Créer une copie (pour le test).
2. La ligne 1 doit contenir exactement : `ID_Coureur, Nom, Prénom, Sexe, Date_Naissance, Email, Téléphone, Club, Statut_Email, Age, Tranche Age, Anomalies, Date_Envoi` (accents et majuscules comptent).
3. Notez le **nom de l'onglet** (en bas de l'écran).
4. Notez l'**identifiant du Sheet** : `https://docs.google.com/spreadsheets/d/`**`IDENTIFIANT`**`/edit`.

## Étape 2 – Compte de service Google (accès lecture seule)
1. console.cloud.google.com → Nouveau projet `challenge-co`.
2. API et services → Bibliothèque → **Google Sheets API** → Activer.
3. IAM et administration → Comptes de service → Créer (nom `lecteur-sheet`), **sans rôle**.
4. Ouvrir le compte → Clés → Ajouter une clé → Créer → **JSON**. Le fichier téléchargé est un secret : ni GitHub, ni mail.
5. Dans ce fichier, copiez l'adresse `client_email` (…@…iam.gserviceaccount.com).
6. Dans le Sheet : Partager → coller cette adresse → rôle **Lecteur** → décocher « Informer » → Partager.
> Si Google bloque la création de clé (règle d'organisation Workspace), créez le projet avec un compte Gmail personnel.

## Étape 3 – Brevo (envoi des mails, sans nom de domaine)
1. Compte gratuit sur brevo.com (peut demander quelques informations d'activation, validation parfois sous quelques heures).
2. Expéditeurs, domaines et IP → Expéditeurs → Ajouter : nom `Challenge CO` + adresse du challenge → cliquer sur le lien du mail de confirmation.
3. SMTP et API → Clés API → Générer une clé `site-co` → la copier immédiatement.

## Étape 4 – Code sur GitHub
1. github.com → New repository `challenge-co-site`, **Private**.
2. Dézipper `co-site.zip` ; dans le dépôt : « uploading an existing file » et y glisser le **contenu** du dossier (`netlify.toml`, `package.json`, `README.md`, dossiers `netlify` et `public`). `netlify.toml` doit être à la racine.
3. Commit changes. Ne jamais déposer le JSON de l'étape 2.

## Étape 5 – Site Netlify
1. netlify.com → connexion avec GitHub.
2. Add new project → Import an existing project → GitHub → `challenge-co-site` (autoriser le dépôt privé).
3. Commande de build vide (le dossier publié vient de `netlify.toml`) → Deploy.
4. Project configuration → General → Change project name (ex. `challenge-co-orga`) → adresse `https://challenge-co-orga.netlify.app`.

## Étape 6 – Variables d'environnement
Project configuration → Environment variables → Add a variable :

| Nom | Valeur |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT` | tout le contenu du JSON, de `{` à `}` |
| `SHEET_ID` | identifiant (étape 1) |
| `SHEET_TAB` | nom exact de l'onglet |
| `SESSION_SECRET` | chaîne aléatoire de 64+ caractères (gestionnaire de mots de passe ou `openssl rand -hex 48`) |
| `ORGANISATEURS` | emails séparés par des virgules, sur une ligne |
| `CHALLENGE_EMAIL` | adresse qui reçoit les corrections |
| `BREVO_API_KEY` | clé Brevo |
| `MAIL_FROM` | adresse expéditeur validée dans Brevo |
| `SITE_URL` | `https://challenge-co-orga.netlify.app` (sans `/` final) |

Puis Deploys → Trigger deploy → **Clear cache and deploy site** (les variables ne sont prises en compte qu'après un déploiement).
Si Netlify refuse `GOOGLE_SERVICE_ACCOUNT` (limite ~4 Ko au total), il faut scinder la variable en deux.

## Étape 7 – Tests
1. Ouvrir le site : écran de connexion avec bannière.
2. Saisir son email → mail reçu (vérifier les spams) → clic sur le lien → liste affichée.
3. Tester recherche, filtres, tris, **Contacts**, onglet Statistiques.
4. **Erreur ?** → envoyer : le mail arrive au challenge, « Répondre » écrit à l'organisateur.
5. Saisir une adresse non listée : message d'erreur rouge, aucun mail envoyé.
6. Netlify → Logs → Functions : on doit voir `login`, `reveal`, `correction`.

## Étape 8 – Dépannage
| Symptôme | Cause / solution |
|---|---|
| Pas de mail de connexion | Adresse absente de `ORGANISATEURS`, expéditeur non validé ou compte Brevo non activé, mail en spam. Voir Brevo → Transactionnel → Logs. |
| « Lien invalide ou expiré » | Lien valable 15 min : en redemander un. Vérifier `SESSION_SECRET` et `SITE_URL`, redéployer. |
| Liste vide / erreur | Logs → Functions : Sheet non partagé avec le compte de service, mauvais `SHEET_ID`/`SHEET_TAB`, API Sheets non activée. |
| Correction non envoyée | Vérifier `CHALLENGE_EMAIL`, `MAIL_FROM`, `BREVO_API_KEY`, logs Brevo. |
| Sheet modifié mais site inchangé | Normal : cache de 5 minutes. |

## Étape 9 – Production et entretien
1. Remplacer `SHEET_ID`/`SHEET_TAB` par ceux du vrai fichier (le partager avec le compte de service) et la liste `ORGANISATEURS` ; redéployer.
2. Prévenir les organisateurs : mail parfois en spam, lien valable 15 min.
3. Ajout/retrait d'un organisateur : modifier `ORGANISATEURS` + redéployer. Changer `SESSION_SECRET` en début de saison (déconnecte tout le monde).
4. RGPD : mention d'information (finalité, destinataires, durée, contact), registre de l'association, vigilance sur les mineurs.

## Remarques de sécurité
- Une adresse inconnue reçoit un message d'erreur explicite : cela révèle si une adresse figure dans la liste. Acceptable pour ~10 organisateurs ; les tentatives sont limitées (5 par IP, 3 par adresse sur 10 min).
- Lien magique non invalidé après usage (pas de stockage) ; limitation de débit en mémoire. Suffisant à cette échelle.
