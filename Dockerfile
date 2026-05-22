FROM node:20-alpine AS builder

# Build arguments
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_BACKEND_API_URL
ARG VITE_BACKEND_API_VERSION
ARG VITE_OXO_LOGO_URL
ARG VITE_OXO_LOGO_WHITE_URL
ARG VITE_LANG
ARG VITE_FALLBACK_LANG
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

# Set as environment variables for Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_BACKEND_API_VERSION=$VITE_BACKEND_API_VERSION
ENV VITE_OXO_LOGO_URL=$VITE_OXO_LOGO_URL
ENV VITE_OXO_LOGO_WHITE_URL=$VITE_OXO_LOGO_WHITE_URL
ENV VITE_LANG=$VITE_LANG
ENV VITE_FALLBACK_LANG=$VITE_FALLBACK_LANG
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN npm install -g pnpm
WORKDIR /app
# Copy all workspace config files and folders needed for Nx
COPY package.json pnpm-lock.yaml* ./
COPY nx.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY .nx ./.nx
COPY apps ./apps
COPY packages ./packages
# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]