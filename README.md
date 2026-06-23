# VirtualIdol 실행 가이드

VirtualIdol은 Spring Boot 기반의 AI 버추얼 아이돌 엔터테인먼트 데모 프로젝트입니다. 가상의 엔터테인먼트 회사 **NOVA Entertainment**와 AI 어시스턴트 **MOMO AI**를 중심으로, 메인 소개 페이지, AI 채팅, Live2D Companion, 굿즈 스토어, 주문/결제 모의 흐름을 체험할 수 있습니다.

이 README는 처음 프로젝트를 내려받은 사람이 바로 실행할 수 있도록 **실행 방법을 중심으로** 정리했습니다.

## 1. 실행 전 준비

### 필수 준비물

- JDK 21 이상
- Git
- 인터넷 연결
- Windows PowerShell 또는 터미널

이 프로젝트는 Maven Wrapper를 포함하고 있으므로 Maven을 따로 설치하지 않아도 됩니다. Windows에서는 `mvnw.cmd`, macOS/Linux에서는 `./mvnw`를 사용하면 됩니다.

### JDK 설치 확인

터미널에서 아래 명령어를 실행합니다.

```powershell
java -version
```

정상이라면 Java 버전이 출력됩니다. 이 프로젝트는 Java 21을 기준으로 작성되었습니다.

예시:

```text
java version "21..."
```

Java가 없거나 버전이 낮다면 JDK 21 이상을 설치한 뒤 다시 진행해야 합니다.

## 2. 프로젝트 내려받기

GitHub에서 프로젝트를 클론합니다.

```powershell
git clone https://github.com/dkemf10004-sketch/Virtual.git
cd Virtual
```

이미 로컬에 프로젝트가 있다면 프로젝트 폴더로 이동하면 됩니다.

```powershell
cd C:\Users\KOSMO\IdeaProjects\VirtualIdol
```

## 3. 가장 간단하게 실행하기

AI 채팅 기능을 제외한 메인 페이지, 굿즈 페이지, 스토어 테스트 페이지는 OpenAI API 키 없이도 실행할 수 있습니다.

Windows PowerShell 기준:

```powershell
.\mvnw.cmd spring-boot:run
```

macOS/Linux 기준:

```bash
./mvnw spring-boot:run
```

실행이 정상적으로 진행되면 Spring Boot 로그가 출력되고, 서버가 `8080` 포트에서 실행됩니다.

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:8080/
```

## 4. 접속 가능한 페이지

서버 실행 후 다음 주소들을 확인할 수 있습니다.

| 페이지 | 주소 | 설명 |
| --- | --- | --- |
| 메인 페이지 | `http://localhost:8080/` | NOVA Entertainment 소개, MOMO AI 채팅 UI, 굿즈 미리보기, Live2D Companion |
| 굿즈 페이지 | `http://localhost:8080/goods/` | MOMO 굿즈 목록 페이지 |
| 스토어 테스트 | `http://localhost:8080/store-test/` | 장바구니, 주문 생성, 모의 결제 테스트 |
| Live2D 테스트 | `http://localhost:8080/live2d-test.html` | Live2D 모델 로딩 확인용 페이지 |

## 5. AI 채팅까지 사용하려면

MOMO AI 채팅 기능은 OpenAI API를 호출합니다. 따라서 실제 AI 응답을 받으려면 `OPENAI_API_KEY` 환경변수를 설정해야 합니다.

### Windows PowerShell

아래 명령어에서 `본인의_API_키` 부분을 실제 키로 바꿔서 실행합니다.

```powershell
$env:OPENAI_API_KEY="본인의_API_키"
$env:OPENAI_MODEL="사용할_모델명"
.\mvnw.cmd spring-boot:run
```

예를 들어 모델명을 따로 지정하지 않으려면 `OPENAI_MODEL`은 생략할 수 있습니다.

```powershell
$env:OPENAI_API_KEY="본인의_API_키"
.\mvnw.cmd spring-boot:run
```

### macOS/Linux

```bash
export OPENAI_API_KEY="본인의_API_키"
export OPENAI_MODEL="사용할_모델명"
./mvnw spring-boot:run
```

모델명을 생략하고 실행할 수도 있습니다.

```bash
export OPENAI_API_KEY="본인의_API_키"
./mvnw spring-boot:run
```

### API 키가 없을 때

API 키를 설정하지 않아도 프로젝트 자체는 실행됩니다. 다만 채팅 API를 호출하면 AI 답변 대신 `OPENAI_API_KEY`가 설정되지 않았다는 안내 메시지가 반환됩니다.

## 6. 실행 중 자주 확인할 것

### 포트 충돌

기본 포트는 `8080`입니다. 이미 다른 프로그램이 `8080` 포트를 사용 중이면 실행에 실패할 수 있습니다.

포트를 바꾸려면 `src/main/resources/application.yml`에서 아래 값을 수정합니다.

```yaml
server:
  port: 8080
```

예를 들어 `9090`으로 바꾸면 실행 후 다음 주소로 접속합니다.

```text
http://localhost:9090/
```

### 서버 종료

실행 중인 터미널에서 `Ctrl + C`를 누르면 서버가 종료됩니다.

### 정적 파일 수정 후 확인

HTML, CSS, JavaScript 파일을 수정한 뒤에는 브라우저 새로고침으로 대부분 확인할 수 있습니다. 서버 코드나 설정 파일을 수정했다면 서버를 재시작하는 것이 안전합니다.

## 7. 테스트 실행

프로젝트 기본 테스트를 실행하려면 아래 명령어를 사용합니다.

Windows:

```powershell
.\mvnw.cmd test
```

macOS/Linux:

```bash
./mvnw test
```

테스트가 성공하면 `BUILD SUCCESS`가 출력됩니다.

## 8. 빌드 후 실행

Spring Boot 애플리케이션을 JAR 파일로 빌드하려면 다음 명령어를 실행합니다.

Windows:

```powershell
.\mvnw.cmd package
```

macOS/Linux:

```bash
./mvnw package
```

빌드가 성공하면 `target/` 폴더에 JAR 파일이 생성됩니다.

실행:

```powershell
java -jar target/VirtualIdol-0.0.1-SNAPSHOT.jar
```

JAR 실행 시에도 AI 채팅을 사용하려면 실행 전에 `OPENAI_API_KEY` 환경변수를 설정해야 합니다.

## 9. 환경 설정 파일

주요 설정 파일은 `src/main/resources/application.yml`입니다.

```yaml
spring:
  application:
    name: VirtualIdol

server:
  port: 8080

openai:
  api-key: ${OPENAI_API_KEY:}
  model: ${OPENAI_MODEL:gpt-5.5}
```

설정 의미:

- `server.port`: 서버 실행 포트
- `openai.api-key`: OpenAI API 키를 환경변수에서 읽음
- `openai.model`: 사용할 OpenAI 모델명을 환경변수에서 읽음

실제 API 키는 이 파일에 직접 적지 말고 반드시 환경변수로 설정해야 합니다.

## 10. 주요 기능

- NOVA Entertainment 메인 랜딩 페이지
- 히어로, 아티스트, 굿즈, 오디션, 뉴스, 문의 섹션
- OpenAI Responses API 기반 MOMO AI 채팅
- 현재 사이트 정보 기반 AI 답변 보강
- Live2D Companion 캐릭터 UI
- MOMO 굿즈 목록과 상세 모달
- 장바구니 진입 기능
- 별도 굿즈 페이지
- 주문 생성과 모의 결제 승인 테스트
- Spring Boot 기반 REST API

## 11. 기술 스택

### 백엔드

- Java 21
- Spring Boot 4.0.6
- Spring Web MVC
- Maven Wrapper
- Java `HttpClient`
- Jackson JSON 처리
- `ConcurrentHashMap` 기반 인메모리 주문 저장소

### 프론트엔드

- HTML
- CSS
- Vanilla JavaScript
- Spring Boot 정적 리소스 서빙
- 브라우저 `localStorage`
- Live2D 모델 리소스

## 12. REST API 요약

### AI 채팅

```http
POST /api/chat
Content-Type: application/json
```

요청 예시:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "MOMO 굿즈에는 어떤 상품이 있어?"
    }
  ]
}
```

응답 예시:

```json
{
  "reply": "..."
}
```

### 주문 생성

```http
POST /api/store/orders
Content-Type: application/json
```

요청 예시:

```json
{
  "customerName": "Demo User",
  "customerEmail": "demo@example.com",
  "paymentMethod": "Mock Payment",
  "items": [
    {
      "productId": "momo-mug",
      "quantity": 1
    }
  ]
}
```

### 모의 결제 승인

```http
POST /api/store/payments/mock/approve
Content-Type: application/json
```

요청 예시:

```json
{
  "orderId": "ord_example"
}
```

### 주문 조회

```http
GET /api/store/orders
GET /api/store/orders/{orderId}
```

## 13. 굿즈 상품 ID

백엔드 주문 API에서 사용할 수 있는 상품 ID입니다.

| 상품 ID | 상품명 | 가격 |
| --- | --- | ---: |
| `momo-mug` | MOMO Mug | 18000 |
| `momo-cap` | MOMO Cap | 29000 |
| `momo-pillow` | MOMO Pillow | 32000 |
| `momo-mousepad` | MOMO Mouse Pad | 24000 |
| `momo-blanket` | MOMO Blanket | 49000 |
| `momo-tshirt` | MOMO T-Shirt | 39000 |

배송비는 현재 `3000`으로 고정되어 있습니다.

## 14. 프로젝트 구조

```text
.
|-- docs/
|-- scripts/
|-- src/
|   |-- main/
|   |   |-- java/com/smu8/virtualidol/
|   |   |   |-- controller/
|   |   |   |-- dto/
|   |   |   |-- service/
|   |   |   `-- store/
|   |   `-- resources/
|   |       |-- application.yml
|   |       `-- static/
|   |           |-- index.html
|   |           |-- app.js
|   |           |-- style.css
|   |           |-- goods/
|   |           |-- store-test/
|   |           |-- assets/
|   |           |-- data/
|   |           `-- live2d-models/
|   `-- test/
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- README.md
```

## 15. 주요 구현 파일

- `src/main/java/com/smu8/virtualidol/VirtualIdolApplication.java`: Spring Boot 애플리케이션 진입점
- `src/main/java/com/smu8/virtualidol/controller/ChatController.java`: AI 채팅 API 컨트롤러
- `src/main/java/com/smu8/virtualidol/service/OpenAiService.java`: OpenAI API 호출과 응답 추출 처리
- `src/main/java/com/smu8/virtualidol/store/controller/StoreOrderController.java`: 스토어 주문 API 컨트롤러
- `src/main/java/com/smu8/virtualidol/store/service/StoreOrderService.java`: 상품 카탈로그, 주문 생성, 모의 결제 승인 로직
- `src/main/resources/static/index.html`: 메인 페이지
- `src/main/resources/static/app.js`: 메인 페이지 상호작용, 채팅, 모달, 굿즈 연동 로직
- `src/main/resources/static/live2d-companion.js`: Live2D Companion 초기화와 상태 제어
- `src/main/resources/static/goods/`: 굿즈 페이지
- `src/main/resources/static/store-test/`: 장바구니와 주문/결제 테스트 페이지
- `src/main/resources/static/assets/`: 이미지와 영상 리소스
- `src/main/resources/static/live2d-models/`: Live2D 모델, 모션, 표정, 텍스처 리소스

## 16. 현재 한계

- 주문 데이터는 서버 메모리에 저장되므로 서버를 재시작하면 사라집니다.
- 결제는 실제 결제가 아니라 모의 승인 방식입니다.
- 일부 정적 데이터 파일에는 한글 인코딩이 깨진 흔적이 있어 UTF-8 기준 정리가 필요합니다.
- 오디션/문의 기능은 실제 저장이나 메일 발송 없이 프론트엔드 중심의 데모 흐름입니다.
- 프로덕션 서비스가 아니라 포트폴리오와 기능 시연을 위한 데모 프로젝트입니다.

## 17. 보안 주의사항

- 실제 API 키는 반드시 환경변수로 설정해야 합니다.
- `application.yml`, Java 코드, JavaScript 코드, README, 문서 파일에 실제 키를 직접 작성하지 마세요.
- `.env`, `.env.*`, `*.pem`, `*.key` 파일은 Git 추적에서 제외되어 있습니다.
- 실수로 실제 키를 커밋했다면 즉시 해당 키를 폐기하고 새 키를 발급해야 합니다.
- 저장소를 Public으로 전환하기 전에는 GitHub Secret scanning 경고와 커밋 히스토리를 다시 확인하는 것이 좋습니다.

## 18. 추가 문서

추가 포트폴리오 문서는 `docs/` 폴더에 있습니다.

- `docs/VirtualIdol_Portfolio_Documentation.md`
- `docs/VirtualIdol_Portfolio_Documentation.docx`
- `docs/NOVA_MOMO_Portfolio_Development_Record.docx`

`scripts/create-portfolio-docx.ps1` 스크립트는 포트폴리오 문서를 Word 파일로 생성하기 위한 보조 스크립트입니다.

## 19. 라이선스

현재 별도 라이선스 파일은 포함되어 있지 않습니다. 저장소를 공개하거나 외부에서 재사용할 수 있게 하려면 목적에 맞는 라이선스를 추가하는 것이 좋습니다.
