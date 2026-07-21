#!/bin/sh
set -eu

IMAGE_TAG="${1:?IMAGE_TAG is required}"
GHCR_NAMESPACE="${2:?GHCR_NAMESPACE is required}"
DOMAIN="${3:-datxe.linuxunity.com}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
STATE_FILE=".last-successful-image"
PREVIOUS_TAG=""

if [ -f "$STATE_FILE" ]; then
  PREVIOUS_TAG="$(cat "$STATE_FILE")"
fi

export IMAGE_TAG GHCR_NAMESPACE

rollback() {
  if [ -z "$PREVIOUS_TAG" ] || [ "$PREVIOUS_TAG" = "$IMAGE_TAG" ]; then
    echo "Deploy failed and no previous image is available for rollback." >&2
    exit 1
  fi

  echo "Health check failed. Rolling back to $PREVIOUS_TAG..." >&2
  IMAGE_TAG="$PREVIOUS_TAG"
  export IMAGE_TAG
  docker compose -f "$COMPOSE_FILE" pull backend frontend
  docker compose -f "$COMPOSE_FILE" up -d --wait backend frontend nginx
  exit 1
}

docker compose -f "$COMPOSE_FILE" config >/dev/null
docker compose -f "$COMPOSE_FILE" pull
mkdir -p "${UPLOAD_HOST_DIR:-./data/uploads}"
docker compose -f "$COMPOSE_FILE" up -d --wait db redis
docker compose -f "$COMPOSE_FILE" run --rm --user root --entrypoint sh backend -c \
  'mkdir -p /app/uploads/public /app/uploads/private && chown -R 1001:1001 /app/uploads'
docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy
docker compose -f "$COMPOSE_FILE" up -d --wait --remove-orphans

attempt=1
while [ "$attempt" -le 20 ]; do
  if curl --fail --silent --show-error "https://$DOMAIN/api/health/ready" >/dev/null; then
    printf '%s\n' "$IMAGE_TAG" > "$STATE_FILE"
    docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
    echo "Deploy $IMAGE_TAG completed successfully."
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 5
done

rollback
