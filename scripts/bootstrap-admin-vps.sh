#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

cd "$PROJECT_DIR"

: "${ADMIN_PHONE:?ADMIN_PHONE is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"

backend_image="$(
  docker ps \
    --filter "label=com.docker.compose.project=datxe" \
    --filter "label=com.docker.compose.service=backend" \
    --format "{{.Image}}" |
    sed -n "1p"
)"

case "$backend_image" in
  ghcr.io/*/datxe-backend:*) ;;
  *)
    echo "Không xác định được image backend production đang chạy." >&2
    echo "Hãy deploy thành công trước khi khôi phục admin." >&2
    exit 1
    ;;
esac

image_path="${backend_image#ghcr.io/}"
GHCR_NAMESPACE="${image_path%/datxe-backend:*}"
IMAGE_TAG="${backend_image##*:}"

bootstrap_command="$(
  docker run --rm --entrypoint node "$backend_image" \
    -e 'process.stdout.write(require("/app/package.json").scripts["admin:bootstrap"] || "")'
)"
if [ "$bootstrap_command" != "node dist/prisma/bootstrap-admin.js" ]; then
  echo "Backend image đang chạy chưa hỗ trợ khôi phục admin bằng số điện thoại." >&2
  echo "Hãy deploy commit mới nhất rồi chạy lại script này." >&2
  exit 1
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_NAME="${ADMIN_NAME:-Quản trị datxe}"
export GHCR_NAMESPACE IMAGE_TAG ADMIN_PHONE ADMIN_PASSWORD ADMIN_EMAIL ADMIN_NAME

echo "Khôi phục admin bằng backend image: $backend_image"
exec docker compose -f "$COMPOSE_FILE" run --rm \
  -e ADMIN_PHONE \
  -e ADMIN_PASSWORD \
  -e ADMIN_EMAIL \
  -e ADMIN_NAME \
  backend npm run admin:bootstrap
