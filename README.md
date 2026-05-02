# final-test (App Repo)

KB ACE Academy 클라우드 네이티브 입문 최종 평가 — **End-to-End GitOps Pipeline**의 Application 저장소.

## 구성

- `server.js` — Node.js HTTP 서버 (port 3000), `APP_MESSAGE` / `APP_VERSION` 환경변수 사용
- `Dockerfile` — Alpine 기반 경량 이미지
- `.github/workflows/ci.yml` — Docker Hub 푸시 + Manifest Repo 자동 업데이트

## 파이프라인 흐름

```
git push (App Repo)
   └─► GitHub Actions
         ├─ docker build/push  →  Docker Hub (devryner/final-test:<sha>)
         └─ sed로 deployment.yaml 이미지 태그 갱신
               └─► Manifest Repo (devryner/final-test-manifest) push
                     └─► Argo CD Auto-Sync → EKS 배포
```

## GitHub Secrets (App Repo Settings → Secrets and variables → Actions)

| Name | 값 |
|------|---|
| `DOCKERHUB_USERNAME` | `devryner` |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |
| `GH_PAT` | Manifest Repo `repo` 권한 PAT |

## 로컬 테스트

```bash
docker build -t final-test:dev .
docker run --rm -p 3000:3000 -e APP_MESSAGE="Hello, Local!" -e APP_VERSION=dev final-test:dev
curl http://localhost:3000
curl http://localhost:3000/healthz
```
