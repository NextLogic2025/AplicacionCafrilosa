// README migrated from Orders_README_generated.md

# Orders microservice

Este módulo gestiona pedidos (orders), carritos (cart) y el flujo relacionado (historial de estados, promociones aplicadas, etc.).

La inicialización de la DB está en: `aplicacion/infra/local-init/05-init-orders.sql`

## Comandos básicos:

```bash
cd aplicacion/backend/services/orders
npm install
npm run build
npm run start:dev
```

## Docker (ejemplo):

```bash
docker build -t orders-service .
docker run -e DB_HOST=host.docker.internal -e DB_USER=admin -e DB_PASSWORD=root -e DB_NAME=orders_db -p 3000:3000 orders-service
```

Ver `Orders_README_generated.md` para documentación extendida, rutas y ejemplos Postman.
