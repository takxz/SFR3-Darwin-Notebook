# 📱 DarwinNoteBook - Documentation Frontend

Bienvenue sur le dépôt Frontend de DarwinNoteBook. 
Cette application est développée en **JavaScript** avec **Expo** et utilise **Expo Router** pour la navigation.

Pour garantir un code maintenable, éviter les conflits Git lors du travail en équipe et s'assurer que les outils de génération de code ne cassent pas la structure, nous suivons une architecture stricte basée sur la séparation des responsabilités (Routage vs Logique métier).

---

## 🏗️ Architecture du Projet

Le projet est divisé en deux piliers principaux : le dossier `app/` (qui gère uniquement la navigation) et le dossier `src/` (qui contient toute la logique et l'interface).


Frontend/
├── app/                    # 🧭 Routage Automatique (Expo Router)
│   ├── _layout.js          # Configuration globale (Headers, Navigation Stack)
│   ├── fight.js            # ⚔️ L'écran de combat (Sans barre d'onglets)
│   └── (tabs)/             # tabs sert à regrouper les écrans, les parenthèses servent à cacher l'arboresence dans l'url
│       ├── _layout.js      # Définit la barre de navigation
│       ├── index.js        # 🏠 Page d'accueil (Route "/")
│       ├── scanner.js      # 📷 Scanner (Route "/scanner")
│       └── bestiary.js     # 📖 Bestiaire (Route "/bestiary")
│
└── src/                    # ⚙️ Cœur de l'application
    ├── components/         # UI globale et générique (Boutons, Inputs, Modales)
    ├── features/           # Logique métier cloisonnée par domaine
    │   ├── fight/          # TOUT ce qui est exclusif au combat (components, hooks)
    │   └── bestiary/       # TOUT ce qui est exclusif au bestiaire
    ├── services/           # Configuration API (Axios/Fetch) pour communiquer avec NodeJS
    ├── hooks/              # Hooks React globaux (ex: useAuth, useTheme)
    ├── utils/              # Fonctions utilitaires pures (formatage, calculs)
    └── assets/             # Images, polices, sons


---
Exemples de présentation gérée nativement par expo :
[ app/_layout.js ]           <-- Le cadre de base du téléphone
      ↳ [ (tabs)/_layout.js ]    <-- Ajoute la barre de menu en bas
            ↳ [ index.js ]           <-- Injecte le contenu "Accueil" au milieu

[ app/_layout.js ]           <-- Le cadre de base du téléphone
      ↳ [ fight.js ]             <-- Injecte le combat en PLEIN ÉCRAN // Sans la barre de navigation
---


### 📝 Template de base pour un nouvel écran

Pour chaque nouvelle page ou composant, utilisez ce squelette. Il montre les équivalences directes avec le développement Web classique (HTML/CSS).

```javascript
import { View, Text, StyleSheet } from 'react-native';

export default function TemplatePage() {
  return (
    // <View> est le conteneur principal. C'est l'équivalent strict de la <div> en HTML.
    <View style={styles.container}>
      
      {/* <Text> est obligatoire pour écrire. C'est l'équivalent de <p>, <span> ou <h1>. */}
      <Text style={styles.title}>Nouvel Écran</Text>
      
    </View>
  );
}

// StyleSheet remplace les fichiers .css. Il compile les styles en natif pour de meilleures performances.
// Note : Le Flexbox sur mobile s'organise en colonne (flexDirection: 'column') par défaut, contrairement au Web.
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  }
});

### 🔗 Imports et Alias (@/)

Pour éviter l'enfer des chemins relatifs (les `../../../../`), nous utilisons un alias absolu configuré dans `jsconfig.json`. 
Le symbole `@/` pointe toujours directement vers le dossier `src/`, peu importe où se trouve le fichier dans lequel vous codez.

❌ À NE PLUS FAIRE (Chemins relatifs) :
Si vous déplacez le fichier, l'import casse.
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useHealthManager } from '../../hooks/useHealthManager';


✅ FAIRE (Chemins absolus) :
import { PrimaryButton } from '@/components/PrimaryButton';
import { useHealthManager } from '@/features/fight/hooks/useHealthManager';