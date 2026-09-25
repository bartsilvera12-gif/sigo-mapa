# SIGO · Flujo de trabajo

Este repo tiene el frontend de Traccar (`traccar-web`) personalizado para SIGO.

## Cómo funciona

1. **Claude edita el código** en la rama `main` y lo sube a GitHub.
2. **Vos, en el servidor**, corrés un solo comando y se despliega todo.

## Configuración inicial (una sola vez, en el servidor)

```bash
cd ~/traccar-web
git fetch origin
git checkout main
git pull origin main
chmod +x deploy.sh
```

## Cada vez que hay cambios nuevos

```bash
cd ~/traccar-web
./deploy.sh
```

El script hace, en orden:
1. Baja los últimos cambios de la rama.
2. Instala dependencias (`npm install`).
3. Compila (`npm run build`).
4. Respalda la web actual en `/opt/traccar/web.bak.FECHA`.
5. Publica el build nuevo en `/opt/traccar/web`.

Después refrescá el navegador con **Ctrl+Shift+R**.

## Si algo sale mal

El script te muestra la ruta del último backup. Para restaurarlo:

```bash
sudo cp -r /opt/traccar/web.bak.FECHA/* /opt/traccar/web/
```

## Ajustes del script

Si tu instalación usa otra carpeta, editá las variables arriba de `deploy.sh`:
- `BRANCH` — rama de trabajo (por defecto `main`).
- `WEB_DIR` — carpeta que sirve Traccar (por defecto `/opt/traccar/web`).
