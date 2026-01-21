swagger: '2.0'
info:
  title: Cafrilosa API Gateway
  description: Gateway unificado para microservicios Serverless
  version: 1.0.0
schemes:
  - https
produces:
  - application/json
paths:
  # ==========================================
  # SERVICIO: AUTH (Login/Registro)
  # ==========================================
  /auth/login:
    post:
      summary: Iniciar sesión
      operationId: authLogin
      x-google-backend:
        address: ${backend_urls["auth"]}/auth/login
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'
  
  /auth/registro:
    post:
      summary: Registrar usuario
      operationId: authRegistro
      x-google-backend:
        address: ${backend_urls["auth"]}/auth/registro
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  # ==========================================
  # SERVICIO: USUARIOS (Gestión de Perfiles)
  # ==========================================
  /usuarios:
    get:
      summary: Listar usuarios
      operationId: getUsuarios
      x-google-backend:
        address: ${backend_urls["usuarios"]}/usuarios
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'
  
  /usuarios/{id}:
    get:
      summary: Obtener usuario por ID
      operationId: getUsuarioById
      parameters:
        - name: id
          in: path
          required: true
          type: string
      x-google-backend:
        address: ${backend_urls["usuarios"]}/usuarios
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  # ==========================================
  # SERVICIO: CATALOG (El monstruo: Clientes, Productos, Zonas)
  # ==========================================
  /productos:
    get:
      summary: Listar productos del catálogo
      operationId: getProductos
      x-google-backend:
        address: ${backend_urls["catalog"]}/products
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  /clientes:
    get:
      summary: Listar clientes
      operationId: getClientes
      x-google-backend:
        address: ${backend_urls["catalog"]}/clientes
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  /sucursales:
    get:
      summary: Listar sucursales
      operationId: getSucursales
      x-google-backend:
        address: ${backend_urls["catalog"]}/sucursales
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  /precios:
    get:
      summary: Listar listas de precios
      operationId: getPrecios
      x-google-backend:
        address: ${backend_urls["catalog"]}/precios
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  /zonas:
    get:
      summary: Listar zonas
      operationId: getZonas
      x-google-backend:
        address: ${backend_urls["catalog"]}/zonas
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  # ==========================================
  # SERVICIO: ORDERS (Pedidos)
  # ==========================================
  /orders:
    post:
      summary: Crear pedido
      operationId: createOrder
      x-google-backend:
        address: ${backend_urls["orders"]}/orders
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'
    get:
      summary: Listar mis pedidos
      operationId: getOrders
      x-google-backend:
        address: ${backend_urls["orders"]}/orders
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  # ==========================================
  # SERVICIO: FINANCE (Reportes/Histórico)
  # ==========================================
  /ventas:
    get:
      summary: Obtener ventas históricas
      operationId: getVentas
      x-google-backend:
        address: ${backend_urls["finance"]}/ventas
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'

  # ==========================================
  # OPTIONS GLOBAL (Para evitar errores CORS en navegadores)
  # ==========================================
  /{proxy+}:
    options:
      operationId: optionsCors
      x-google-backend:
        address: ${backend_urls["auth"]} # Dummy backend para responder el OPTIONS
        deadline: 1.0 
      responses:
        '200':
          description: OK
      cors:
        allowOrigin: '*'
        allowMethods: GET, POST, PUT, DELETE, OPTIONS
        allowHeaders: '*'