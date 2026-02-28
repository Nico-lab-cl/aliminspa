# ── Etapa 1: usar nginx liviano (Alpine) ──────────────────────────────────────
FROM nginx:alpine

# Copiar la página al directorio público de nginx
COPY index.html /usr/share/nginx/html/index.html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
