# Utiliser l'image Node.js alpine légère
FROM node:22-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier le code source et compiler les assets Vite
COPY . .
RUN npm run build

# Port d'écoute standard
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Démarrer le serveur full-stack Express
CMD ["npm", "start"]
