@echo off
REM Inicia el servidor JSON Server para la gestión de inventario de Mercados La Convención
REM Este script debe ejecutarse en la raíz del proyecto donde está db.json
REM Abre una terminal en esta carpeta y ejecuta este archivo para iniciar el backend
npx json-server --watch db.json --port 3001
