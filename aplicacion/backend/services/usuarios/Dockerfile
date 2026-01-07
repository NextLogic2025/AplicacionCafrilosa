# ---------------------------------------------------
# ETAPA 1: BUILD (Construcción)
# Usamos una imagen ligera de Node (versión 22 LTS, la 24 aún no es estable/LTS)
# ---------------------------------------------------
FROM node:22-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo los archivos de dependencias primero (para aprovechar el caché de Docker)
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo las de desarrollo para compilar)
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Compilamos el proyecto (genera la carpeta /dist)
RUN npm run build

# ---------------------------------------------------
# ETAPA 2: PRODUCTION (Ejecución)
# Creamos una imagen limpia y pequeña solo con lo necesario
# ---------------------------------------------------
FROM node:22-alpine

WORKDIR /app

# Copiamos solo las dependencias de producción (sin herramientas de testeo, etc.)
COPY package*.json ./
RUN npm install --only=production

# Copiamos la carpeta 'dist' generada en la etapa anterior
COPY --from=builder /app/dist ./dist

# Exponemos el puerto (NestJS usa 3000 por defecto)
EXPOSE 3000

# Comando para iniciar el microservicio
CMD ["node", "dist/main"]