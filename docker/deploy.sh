#!/usr/bin/env bash
set -euo pipefail

# Prevent overlapping deployments
exec 9>/tmp/kassa-deploy.lock
flock -x 9

REPO_DIR="/home/boxd/kassa-POS"
COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE=".env"
REBUILD_ALL="${1:-false}"
PASSED_OLD_SHA="${2:-}"

cd "$REPO_DIR"

OLD_SHA="${PASSED_OLD_SHA:-$(git rev-parse HEAD)}"
echo "==> Fetching latest main..."
git fetch origin main
git pull --ff-only origin main
NEW_SHA=$(git rev-parse HEAD)

echo "==> Deploy commit: ${OLD_SHA:0:7} -> ${NEW_SHA:0:7}"
echo "KASSA_DEPLOY_FROM_SHA=${OLD_SHA:0:7}"
echo "KASSA_DEPLOY_TO_SHA=${NEW_SHA:0:7}"

CHANGED_FILES=""
if [ "$OLD_SHA" != "$NEW_SHA" ]; then
  CHANGED_FILES=$(git diff --name-only "$OLD_SHA" "$NEW_SHA")
  echo "==> Changed files:"
  echo "$CHANGED_FILES"
else
  echo "==> Already up to date."
fi

build_service() {
  local svc="$1"
  local attempt=1
  local max_attempts=3
  while [ "$attempt" -le "$max_attempts" ]; do
    echo "==> Building & restarting ${svc} (attempt ${attempt}/${max_attempts})..."
    if sudo docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --no-deps "$svc"; then
      return 0
    fi
    if [ "$attempt" -lt "$max_attempts" ]; then
      echo "==> Build for ${svc} failed (attempt ${attempt}), retrying in 3s..."
      sleep 3
    fi
    attempt=$((attempt + 1))
  done
  echo "==> Build for ${svc} failed after ${max_attempts} attempts."
  return 1
}

NEED_ALL=false
if [ "$REBUILD_ALL" = "true" ] || [ "$REBUILD_ALL" = "--all" ]; then
  NEED_ALL=true
elif echo "$CHANGED_FILES" | grep -qE "^(packages/shared/|package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.base\.json|docker/docker-compose\.prod\.yml)"; then
  NEED_ALL=true
fi

SERVICES_TO_BUILD=()
if [ "$NEED_ALL" = true ]; then
  SERVICES_TO_BUILD=(api admin-api web landing backoffice)
else
  echo "$CHANGED_FILES" | grep -qE "^(apps/api/|docker/Dockerfile\.api)" && SERVICES_TO_BUILD+=(api)
  echo "$CHANGED_FILES" | grep -qE "^(apps/admin-api/|apps/api/prisma/|docker/Dockerfile\.admin-api)" && SERVICES_TO_BUILD+=(admin-api)
  echo "$CHANGED_FILES" | grep -qE "^(apps/web/|docker/Dockerfile\.web)" && SERVICES_TO_BUILD+=(web)
  echo "$CHANGED_FILES" | grep -qE "^(apps/landing/|docker/Dockerfile\.landing)" && SERVICES_TO_BUILD+=(landing)
  echo "$CHANGED_FILES" | grep -qE "^(apps/backoffice/|docker/Dockerfile\.backoffice)" && SERVICES_TO_BUILD+=(backoffice)
fi

if [ ${#SERVICES_TO_BUILD[@]} -eq 0 ]; then
  echo "KASSA_DEPLOY_SERVICES=none"
  echo "==> No app Dockerfiles or source files changed; skipping image builds."
else
  IFS=, ; echo "KASSA_DEPLOY_SERVICES=${SERVICES_TO_BUILD[*]}" ; unset IFS
  for svc in "${SERVICES_TO_BUILD[@]}"; do
    build_service "$svc"
  done
fi

if echo "$CHANGED_FILES" | grep -qE "^apps/api/prisma/"; then
  echo "==> Prisma schema changed; running db push..."
  sudo docker exec kassa_api_prod npx prisma db push --skip-generate
fi

if echo "$CHANGED_FILES" | grep -qE "^docker/nginx\.conf"; then
  echo "==> Nginx config changed; reloading nginx..."
  sudo docker exec kassa_nginx_prod nginx -t
  sudo docker exec kassa_nginx_prod nginx -s reload
fi

echo "==> Running health checks..."
sleep 3
for target in \
  "kassa.biz.id:/" \
  "app.kassa.biz.id:/" \
  "app-api.kassa.biz.id:/health" \
  "admin.kassa.biz.id:/" \
  "admin-api.kassa.biz.id:/health"; do
  h="${target%%:*}"
  p="${target#*:}"
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $h" "http://127.0.0.1:80${p}")
  echo "    ${h}${p} -> HTTP ${code}"
done

echo "==> Deploy finished successfully!"
