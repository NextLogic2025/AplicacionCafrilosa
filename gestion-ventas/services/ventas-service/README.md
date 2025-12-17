# Ventas Service

Microservicio `ventas-service` con estructura DDD y capas separadas.

## Versión de Node para el proyecto

Este servicio está probado con Node `22.14.0`. Para forzar esa versión localmente usa `nvm`:

```bash
# en la raíz del servicio
nvm install 22.14.0   # instala si no la tienes
nvm use 22.14.0       # activa la versión para esta shell
# o, si usas el archivo .nvmrc, desde la raíz del servicio:
nvm install           # nvm lee .nvmrc e instala/usa la versión indicada
```

He añadido un archivo `.nvmrc` en este directorio con la versión `22.14.0`.

Notas:
- La versión de `npm` está ligada a la versión de `node` que actives con `nvm`.
- Si actualizas `npm` globalmente mientras usas `nvm`, la actualización afectará solo a la versión actual de Node.

Comandos rápidos para desarrollo:

```bash
cd Backend/gestion-ventas/services/ventas-service
nvm use            # si tienes .nvmrc, nvm leerá la versión
npm install
npm run dev
```

