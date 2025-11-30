# Proyecto de Predicción de Tráfico

> Aplicación web para predecir la congestión del tráfico y recomendar la mejor ruta basada en datos históricos. El frontend está construido con Next.js y el backend proporciona una API REST.

Este documento proporciona todas las instrucciones necesarias para configurar, instalar y ejecutar el entorno de desarrollo localmente.

## Índice

*   [Prerrequisitos](#prerrequisitos)
*   [Instalación](#instalación)
    *   [1. Clonar el Repositorio](#1-clonar-el-repositorio)
    *   [2. Instalar Bun](#2-instalar-bun)
    *   [3. Instalar Dependencias](#3-instalar-dependencias)
    *   [4. Configurar Variables de Entorno](#4-configurar-variables-de-entorno)
*   [Levantando el Entorno de Desarrollo](#levantando-el-entorno-de-desarrollo)
    *   [Ejecutar el Backend](#ejecutar-el-backend)
    *   [Ejecutar el Frontend](#ejecutar-el-frontend)
*   [Scripts Disponibles](#scripts-disponibles)
*   [Estructura del Proyecto](#estructura-del-proyecto)
*   [Endpoints de la API](#endpoints-de-la-api)
*   [Contribuciones](#contribuciones)

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado `git` en tu sistema.

## Instalación

Sigue estos pasos para tener el entorno de desarrollo funcionando.

### 1. Clonar el Repositorio

Primero, clona el repositorio en tu máquina local:

```bash
git clone https://github.com/tu-usuario/project_predict-traffic.git
cd project_predict-traffic
```

### 2. Instalar Bun

Este proyecto utiliza Bun como runtime de JavaScript, gestor de paquetes y bundler.

#### En macOS y Linux

Abre tu terminal y ejecuta el siguiente comando:

```bash
curl -fsSL https://bun.sh/install | bash
```

Después de la instalación, puede que necesites reiniciar tu terminal. Para verificar que se instaló correctamente, ejecuta:

```bash
bun --version
```

### 3. Instalar Dependencias

El proyecto está organizado en dos carpetas principales: `backend` y `frontend`. Debes instalar las dependencias para ambas partes.

#### Dependencias del Backend

Navega a la carpeta del backend y usa `bun` para instalar los paquetes:

```bash
cd backend
bun install
```

#### Dependencias del Frontend

Ahora, haz lo mismo para el frontend:

```bash
cd ../frontend
bun install
```

### 4. Configurar Variables de Entorno

Es probable que el proyecto necesite variables de entorno para funcionar (ej. URLs de la API). En las carpetas `backend` y/o `frontend`, busca archivos llamados `.env.example`.

Copia estos archivos a `.env` y rellena los valores necesarios.

**Ejemplo para el frontend:**

```bash
cd frontend
cp .env.example .env
```

Abre el nuevo archivo `frontend/.env` y configura las variables, por ejemplo, la URL del backend:

```env
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Levantando el Entorno de Desarrollo

Se recomienda usar dos terminales separadas, una para el backend y otra para el frontend.

### Ejecutar el Backend

En una terminal, navega a la carpeta del backend (asumiendo que es un proyecto Django/FastAPI) y ejecuta el servidor:

```bash
cd backend
# Ejemplo para Django/FastAPI, ajusta según tu proyecto
python manage.py runserver
```

Esto iniciará el servidor de la API, generalmente en `http://localhost:8000`.

### Ejecutar el Frontend

En una segunda terminal, navega a la carpeta del frontend y ejecuta su script de desarrollo:

```bash
cd frontend
bun run dev
```

Esto iniciará el servidor de desarrollo de Next.js. Podrás acceder a la aplicación en tu navegador en `http://localhost:3000`.

## Scripts Disponibles

### Frontend (`frontend/package.json`)

*   `bun run dev`: Inicia el servidor de desarrollo del frontend.
*   `bun run build`: Genera la versión de producción de la aplicación.
*   `bun run start`: Inicia un servidor de producción con la build generada.
*   `bun run lint`: Ejecuta el linter para revisar la calidad del código.

## Estructura del Proyecto

```
.
├── backend/              # Contiene todo el código del servidor (API en Python)
├── frontend/             # Contiene todo el código de la aplicación cliente (Next.js)
│   ├── app/              # Código fuente del frontend
│   └── package.json      # Dependencias y scripts del frontend
│
├── .gitignore            # Archivos y carpetas ignorados por Git
└── README.md             # Este archivo
```

## Endpoints de la API

### 1. Predecir Congestión de Tráfico

Este endpoint predice la congestión del tráfico para un segmento específico en una fecha dada.

*   **URL:** `/api/predict-traffic/`
*   **Método:** `GET`
*   **Parámetros de Consulta:**
    *   `segmento_id` (entero, requerido): El ID del segmento (1-10).
    *   `fecha` (string, opcional): La fecha para la predicción en formato `YYYY-MM-DD`. Si no se proporciona, se usa la fecha actual.
*   **Ejemplo:**
    `/api/predict-traffic/?segmento_id=1&fecha=2025-02-01`
*   **Respuesta Exitosa:**
    *   **Código:** 200 OK
    *   **Contenido:** Un objeto JSON con la predicción de tráfico para 24 horas.

### 2. Recomendar Mejor Ruta

Este endpoint recomienda la mejor ruta basándose en la predicción de tráfico para una fecha y hora dadas.

*   **URL:** `/api/recommend-route/`
*   **Método:** `GET`
*   **Parámetros de Consulta:**
    *   `fecha_hora` (string, requerido): La fecha y hora para la recomendación en formato `YYYY-MM-DD HH:MM:SS`.
*   **Ejemplo:**
    `/api/recommend-route/?fecha_hora=2025-02-01%2008:00:00`
*   **Respuesta Exitosa:**
    *   **Código:** 200 OK
    *   **Contenido:** Un objeto JSON con la ruta recomendada.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas colaborar, por favor sigue estos pasos:

1.  Haz un "Fork" del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y haz "commit" (`git commit -m 'Añade nueva funcionalidad'`).
4.  Haz "Push" a tu rama (`git push origin feature/nueva-funcionalidad`).
5.  Abre un "Pull Request".
