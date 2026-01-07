#!/bin/bash
# Configuración inicial para Cafrisales
export PROJECT_ID="cafrisales-prod"
export REGION="us-east1"

# 1. Habilitar APIs necesarias
gcloud services enable \
    compute.googleapis.com \
    servicenetworking.googleapis.com \
    vpcaccess.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    apigateway.googleapis.com

# 2. IMPORTANTE: Vincular el repositorio de GitHub (Paso manual/semi-manual)
# Terraform no puede crear la conexión física inicial de GitHub. 
# Debes ir a la consola de Cloud Build -> Repositorios y conectar:
# NextLogic2025/AplicacionCafrilosa
echo "Asegúrate de haber conectado NextLogic2025/AplicacionCafrilosa en Cloud Build Console."