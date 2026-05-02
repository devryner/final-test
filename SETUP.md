# 🚀 Final Test 셋업 가이드 (End-to-End GitOps Pipeline)

KB ACE Academy 클라우드 네이티브 입문 최종 평가용. 아래 순서대로 진행하면 평가 채점 항목 5개(20점×5)를 모두 충족합니다.

---

## 📦 0. 준비물 체크리스트

- [ ] Docker Hub 계정 (`devryner`)
- [ ] GitHub 계정 (`devryner`)
- [ ] EKS 클러스터 (kubectl 접속 가능)
- [ ] AWS LoadBalancer 생성 권한 (워커 노드 IAM에 ELB 권한)
- [ ] 로컬 도구: `aws`, `kubectl`, `docker`, `git`

---

## 1. Docker Hub 레포 & 토큰 준비

1. https://hub.docker.com 로그인 → **Repositories → Create repository**
   - Name: `final-test`
   - Visibility: Public
2. **Account Settings → Security → New Access Token**
   - Description: `gh-actions-final-test`
   - Permissions: **Read, Write, Delete**
   - 생성된 토큰 문자열을 메모해두기 (한 번만 표시됨)

---

## 2. GitHub 레포 생성 & 코드 푸시

### 2-1. App Repo (이미 `devryner/final-test`로 remote 설정됨)

```bash
cd /Users/chiwonchoi/Documents/project/cloud-class/final-test

git add .
git commit -m "feat: initial GitOps pipeline setup"
git branch -M main
git push -u origin main
```

### 2-2. Manifest Repo 생성

GitHub 웹에서 `devryner/final-test-manifest` Public 레포 생성 (README 체크 해제) 후:

```bash
cd /Users/chiwonchoi/Documents/project/cloud-class/final-test-manifest

git init
git branch -M main
git add .
git commit -m "feat: initial manifests for final-test"
git remote add origin https://github.com/devryner/final-test-manifest.git
git push -u origin main
```

또는 `gh` CLI:
```bash
cd /Users/chiwonchoi/Documents/project/cloud-class/final-test-manifest
gh repo create devryner/final-test-manifest --public --source=. --remote=origin --push
```

---

## 3. GitHub Personal Access Token 발급 (Manifest Repo 푸시용)

**Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**

- Token name: `manifest-repo-pusher`
- Expiration: 30 days (또는 적절히)
- Repository access: **Only select repositories → `devryner/final-test-manifest`**
- Repository permissions:
  - **Contents: Read and write**
  - **Metadata: Read-only**
- Generate → 토큰 문자열 메모 (한 번만 표시)

> Classic PAT을 쓰는 경우: `repo` 스코프 전체 체크.

---

## 4. App Repo 에 GitHub Secrets 등록

`devryner/final-test` 레포 → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|------|-------|
| `DOCKERHUB_USERNAME` | `devryner` |
| `DOCKERHUB_TOKEN` | 1번에서 만든 Docker Hub 토큰 |
| `GH_PAT` | 3번에서 만든 GitHub PAT |

🖼 **스크린샷 캡처**: 이 화면이 평가 제출물 #2.

---

## 5. CI 동작 확인

App Repo에 작은 변경 후 push:

```bash
cd /Users/chiwonchoi/Documents/project/cloud-class/final-test
echo "" >> README.md
git commit -am "ci: trigger first build"
git push
```

App Repo → **Actions** 탭에서 `CI - Build, Push & Update Manifest` 워크플로우 진행 확인:
- `build-and-push` ✅
- `update-manifest` ✅

🖼 **스크린샷 캡처**:
- 제출물 #3: Actions 실행 성공 (Green Check) 화면
- 제출물 #4: Docker Hub의 `devryner/final-test` 레포에 새 태그(예: `a1b2c3d`) 표시 화면

Manifest Repo에 자동 커밋(`deploy: bump image to ...`)이 들어왔는지 확인.

---

## 6. EKS 클러스터에 Argo CD 설치

```bash
# 클러스터 접속
aws eks update-kubeconfig --region ap-northeast-2 --name <YOUR_CLUSTER>
kubectl get nodes

# Argo CD 설치
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Pod Ready 대기
kubectl get pods -n argocd -w
# Ctrl+C로 빠져나오기

# UI 외부 노출
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "LoadBalancer"}}'

# ELB 주소 확인 (1~2분 소요)
kubectl get svc argocd-server -n argocd

# 초기 admin 비밀번호
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d ; echo
```

브라우저 → `https://<argocd ELB>` → admin / 위 비밀번호 로그인.

---

## 7. Argo CD 에 Application 등록

Manifest Repo가 GitHub에 올라간 상태에서:

```bash
kubectl apply -f /Users/chiwonchoi/Documents/project/cloud-class/final-test-manifest/argocd-application.yaml
```

Argo CD UI에서 `final-test` 앱이 자동으로 Sync 시작 → **Synced + Healthy** 상태가 되는지 확인.

🖼 **스크린샷 캡처**: 제출물 #5: Argo CD Dashboard `Synced + Healthy` 화면.

---

## 8. 서비스 접속 확인

```bash
kubectl get svc -n final-test
# NAME         TYPE           EXTERNAL-IP                                                              PORT(S)
# final-test   LoadBalancer   aXXXXXX.ap-northeast-2.elb.amazonaws.com                                 80:30xxx/TCP

# 1~2분 후
curl http://<final-test ELB>
# → HTML 응답 확인
```

브라우저로 `http://<final-test ELB>` 접속 → 다음 화면 확인:
- "Hello from Kubernetes Secret!" (← K8s Secret 주입 성공)
- "Version: <commit-sha>" (← Docker build-arg 주입 성공)

🖼 **스크린샷 캡처**: 제출물 #6: 브라우저 접속 화면.

---

## 9. End-to-End 동작 검증 (선택, 권장)

`server.js`의 메시지 일부 변경 후 push:

```bash
cd /Users/chiwonchoi/Documents/project/cloud-class/final-test
sed -i '' 's/KB ACE Academy/KB ACE Academy v2/' server.js
git commit -am "feat: bump to v2"
git push
```

흐름이 자동으로 흘러가는지 확인:
1. App Repo → CI 실행 → Docker Hub 새 태그 푸시
2. Manifest Repo에 `deploy: bump image to ...:<newsha>` 커밋 자동 추가
3. Argo CD UI에서 OutOfSync → Sync (자동) → 새 Pod로 롤링 업데이트
4. 브라우저에서 변경된 메시지 확인

---

## 📋 평가 제출물 매핑

| 제출 항목 | 어디서 캡처? |
|-----------|-------------|
| ① GitHub Repository URL | `https://github.com/devryner/final-test` (App Repo, 평가 양식에 텍스트로) |
| ② GitHub Secrets 화면 | 위 4번 단계 |
| ③ GitHub Actions Green Check | 위 5번 단계 |
| ④ Docker Hub 이미지 리스트 | 위 5번 단계 |
| ⑤ Argo CD Synced/Healthy | 위 7번 단계 |
| ⑥ LoadBalancer 접속 화면 | 위 8번 단계 |

---

## 🎯 채점 항목 충족도 (100점 만점)

| 평가 항목 | 충족 여부 |
|-----------|----------|
| App/Manifest 레포 분리 (20) | ✅ `final-test` + `final-test-manifest` |
| Docker 빌드 & 푸시 자동화 (20) | ✅ `ci.yml` build-and-push job |
| 매니페스트 자동 업데이트 (20) | ✅ `ci.yml` update-manifest job (sed + git push) |
| Argo CD 자동 배포 (20) | ✅ `argocd-application.yaml` (automated + selfHeal + prune) |
| Secrets 사용 + 페이지 접속 (20) | ✅ GitHub Secrets 3종 + K8s Secret(`APP_MESSAGE`) + LoadBalancer 노출 |

---

## 🧹 평가 후 정리 (선택)

```bash
# 비용 발생 리소스 삭제
kubectl delete -f /Users/chiwonchoi/Documents/project/cloud-class/final-test-manifest/argocd-application.yaml
kubectl delete namespace final-test
kubectl delete namespace argocd
# EKS 클러스터 자체도 사용 안 하면 삭제 (eksctl 등으로)
```

---

## 🛠 트러블슈팅

| 증상 | 원인 / 해결 |
|------|-----------|
| `update-manifest` job에서 403 push 거부 | `GH_PAT` 권한에 manifest repo Contents Write 누락 |
| Docker push 401 | `DOCKERHUB_TOKEN` 권한이 Read-only이거나 만료됨 |
| Argo CD "ComparisonError" | Manifest Repo URL/branch 오타 → `argocd-application.yaml` 확인 |
| Pod CrashLoopBackOff | `kubectl logs -n final-test deploy/final-test`로 원인 확인 |
| Service EXTERNAL-IP `<pending>` | EKS 워커 노드 IAM에 ELB 생성 권한 부족, 또는 서브넷 태그 미설정 |
