#!/usr/bin/env bash
set -euo pipefail

declare -r ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
declare -r VERSION="$(node -p "JSON.parse(require('fs').readFileSync('${ROOT}/module.json','utf8')).version")"
declare -r DIST="${ROOT}/dist"
declare -r STAGE="${DIST}/stage"
declare -r MODULE_STAGE="${STAGE}/runyth-npc-button"
declare -r INSTALL_ZIP="${DIST}/runyth-npc-button-${VERSION}.zip"
declare -r SOURCE_ZIP="${DIST}/runyth-npc-button-${VERSION}-src.zip"
declare -r DOC_ZIP="${DIST}/runyth-npc-button-${VERSION}-doc.zip"

rm -rf "${DIST}"
mkdir -p "${MODULE_STAGE}"

cp "${ROOT}/module.json" "${MODULE_STAGE}/"
cp -R "${ROOT}/lang" "${ROOT}/scripts" "${ROOT}/styles" "${MODULE_STAGE}/"
(
  cd "${STAGE}"
  zip -q -r "${INSTALL_ZIP}" runyth-npc-button
)

(
  cd "$(dirname "${ROOT}")"
  zip -q -r "${SOURCE_ZIP}" "$(basename "${ROOT}")" \
    -x "$(basename "${ROOT}")/dist/*"
)

mkdir -p "${STAGE}/docs"
cp "${ROOT}/README.md" "${ROOT}/CHANGELOG.md" "${ROOT}/CONTRIBUTING.md" "${ROOT}/SECURITY.md" "${ROOT}/LICENSE" "${STAGE}/docs/"
cp -R "${ROOT}/docs" "${STAGE}/docs/project-docs"
(
  cd "${STAGE}/docs"
  zip -q -r "${DOC_ZIP}" .
)

if unzip -Z1 "${DOC_ZIP}" | grep -Eq '(^|/)module\.json$'; then
  printf 'Refusing release: documentation ZIP contains module.json\n' >&2
  exit 1
fi

(
  cd "${DIST}"
  sha256sum "$(basename "${INSTALL_ZIP}")" "$(basename "${SOURCE_ZIP}")" "$(basename "${DOC_ZIP}")" > "runyth-npc-button-${VERSION}-SHA256SUMS.txt"
)

rm -rf "${STAGE}"
printf 'Built release artifacts in %s\n' "${DIST}"
