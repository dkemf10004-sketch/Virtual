# VirtualIdol

Spring Boot 기반의 AI 버추얼 아이돌 엔터테인먼트 데모 프로젝트입니다. 가상의 엔터테인먼트 회사 **NOVA Entertainment**와 AI 버추얼 유튜버 어시스턴트 **MOMO AI**를 중심으로, 소개 페이지, AI 채팅, Live2D Companion, 굿즈 스토어, 주문/결제 모의 흐름을 하나의 웹 애플리케이션으로 구성했습니다.

## 프로젝트 소개

VirtualIdol은 단순한 정적 소개 페이지가 아니라, 사용자가 페이지를 탐색하고 AI에게 질문하며 굿즈를 확인하고 주문 흐름까지 체험할 수 있도록 만든 포트폴리오형 웹 프로젝트입니다.

백엔드는 Spring Boot로 구성되어 정적 프론트엔드 파일을 제공하고, AI 채팅 API와 굿즈 주문 API를 처리합니다. 프론트엔드는 HTML, CSS, Vanilla JavaScript로 작성되어 별도 빌드 도구 없이 Spring Boot의 `static` 리소스 경로에서 바로 제공됩니다.

## 주요 기능

- NOVA Entertainment 메인 랜딩 페이지
- 히어로, 아티스트, 굿즈, 오디션, 뉴스, 문의 섹션 구성
- OpenAI Responses API를 활용한 MOMO AI 채팅
- 현재 사이트 정보 기반의 AI 답변 보강
- Live2D Companion 캐릭터 UI
- MOMO 굿즈 목록, 상세 모달, 장바구니 진입 기능
- 별도 굿즈 페이지
- 장바구니, 주문 생성, 모의 결제 승인 테스트 페이지
- Spring Boot 기반 REST API
- 환경변수 기반 API 키 설정

## 기술 스택

### 백엔드

- Java 21
- Spring Boot 4.0.6
- Spring Web MVC
- Maven Wrapper
- Java `HttpClient`
- Jackson 기반 JSON 처리
- `ConcurrentHashMap` 기반 인메모리 주문 저장소

### 프론트엔드

- HTML
- CSS
- Vanilla JavaScript
- Spring Boot 정적 리소스 서빙
- 브라우저 `localStorage` 기반 장바구니/주문 테스트 데이터
- Live2D 모델 리소스

## 프로젝트 구조

```text
.
├── docs/
│   ├── NOVA_MOMO_Portfolio_Development_Record.docx
│   ├── VirtualIdol_Portfolio_Documentation.docx
│   └── VirtualIdol_Portfolio_Documentation.md
├── scripts/
│   └── create-portfolio-docx.ps1
├── src/
│   ├── main/
│   │   ├── java/com/smu8/virtualidol/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── service/
│   │   │   └── store/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── static/
│   │           ├── index.html
│   │           ├── app.js
│   │           ├── style.css
│   │           ├── goods/
│   │           ├── store-test/
│   │           ├── assets/
│   │           ├── data/
│   │           └── live2d-models/
│   └── test/
├── mvnw
├── mvnw.cmd
├── pom.xml
└── README.md
```

## 실행 요구사항

- JDK 21 이상
- Maven Wrapper 사용 가능 환경
- AI 채팅 기능 사용 시 OpenAI API 키
- AI 응답 호출 시 인터넷 연결

OpenAI API 키가 없어도 메인 페이지, 굿즈 페이지, 스토어 테스트 페이지는 확인할 수 있습니다. 다만 AI 채팅 API는 `OPENAI_API_KEY`가 설정되어 있지 않으면 키가 없다는 안내 메시지를 반환합니다.

## 환경변수 설정

설정 파일은 `src/main/resources/application.yml`입니다.

```yaml
server:
  port: 8080

openai:
  api-key: ${OPENAI_API_KEY:}
  model: ${OPENAI_MODEL:gpt-5.5}
```

실제 API 키는 코드에 직접 작성하지 말고 환경변수로 주입해야 합니다.

### Windows PowerShell

```powershell
$env:OPENAI_API_KEY="본인의_API_키"
$env:OPENAI_MODEL="사용할_모델명"
.\mvnw.cmd spring-boot:run
```

### macOS/Linux

```bash
export OPENAI_API_KEY="본인의_API_키"
export OPENAI_MODEL="사용할_모델명"
./mvnw spring-boot:run
```

## 로컬 실행 방법

프로젝트 루트에서 다음 명령어를 실행합니다.

```powershell
.\mvnw.cmd spring-boot:run
```

실행 후 브라우저에서 아래 주소로 접속합니다.

- 메인 페이지: `http://localhost:8080/`
- 굿즈 페이지: `http://localhost:8080/goods/`
- 스토어 테스트 페이지: `http://localhost:8080/store-test/`
- Live2D 테스트 페이지: `http://localhost:8080/live2d-test.html`

## 테스트와 빌드

테스트 실행:

```powershell
.\mvnw.cmd test
```

패키징:

```powershell
.\mvnw.cmd package
```

패키징된 JAR 실행:

```powershell
java -jar target/VirtualIdol-0.0.1-SNAPSHOT.jar
```

## 주요 화면

### `/`

NOVA Entertainment 메인 페이지입니다. 회사 소개, 아티스트 소개, MOMO 굿즈 미리보기, 오디션 안내, 뉴스, 문의 영역, AI 채팅 UI, Live2D Companion 기능이 포함되어 있습니다.

### `/goods/`

MOMO 굿즈를 더 집중적으로 보여주는 별도 굿즈 페이지입니다.

### `/store-test/`

장바구니, 주문 생성, 모의 결제 승인을 테스트하기 위한 페이지입니다. 실제 결제 연동이 아니라 포트폴리오용 모의 흐름입니다.

### `/live2d-test.html`

Live2D 모델 로딩과 표시 상태를 따로 확인하기 위한 테스트 페이지입니다.

## REST API

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

서버는 최근 대화 메시지를 OpenAI Responses API로 전달합니다. 또한 `static/data/site-info.json`의 사이트 정보를 함께 지시문에 포함하여, MOMO AI가 현재 데모 페이지와 굿즈 정보에 맞춰 답변할 수 있도록 구성했습니다.

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

### 주문 목록 조회

```http
GET /api/store/orders
```

### 단일 주문 조회

```http
GET /api/store/orders/{orderId}
```

## 굿즈 상품 목록

현재 백엔드에서 지원하는 상품 ID는 다음과 같습니다.

| 상품 ID | 상품명 | 가격 |
| --- | --- | ---: |
| `momo-mug` | MOMO Mug | 18000 |
| `momo-cap` | MOMO Cap | 29000 |
| `momo-pillow` | MOMO Pillow | 32000 |
| `momo-mousepad` | MOMO Mouse Pad | 24000 |
| `momo-blanket` | MOMO Blanket | 49000 |
| `momo-tshirt` | MOMO T-Shirt | 39000 |

배송비는 현재 `3000`으로 고정되어 있습니다.

## 주요 구현 파일

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

## 구현상 특징

- 채팅 요청은 최근 메시지 일부만 OpenAI API에 전달하여 요청 크기를 제한합니다.
- AI 지시문에는 사이트 정보 JSON을 포함하여 데모 페이지 기준의 답변을 유도합니다.
- API 키가 없거나 API 호출에 실패할 경우 사용자에게 안내 메시지를 반환합니다.
- 주문 데이터는 데이터베이스가 아니라 서버 메모리에 저장됩니다.
- 결제는 실제 결제가 아닌 모의 승인 방식으로 처리됩니다.
- 프론트엔드 장바구니 상태는 브라우저 `localStorage`에 저장됩니다.

## 현재 한계

- 주문 데이터가 인메모리 방식이라 서버를 재시작하면 사라집니다.
- 실제 결제 API와 연결되어 있지 않습니다.
- 일부 정적 데이터 파일에는 한글 인코딩이 깨진 흔적이 있어 UTF-8 기준으로 정리할 필요가 있습니다.
- `OPENAI_MODEL` 기본값은 설정 파일에 정의되어 있으므로 실제 운영 전 사용할 수 있는 모델명인지 확인해야 합니다.
- 오디션/문의 기능은 실제 서버 저장이나 메일 발송 없이 프론트엔드 중심의 데모 흐름입니다.
- 프로덕션 서비스가 아니라 포트폴리오와 기능 시연을 위한 데모 프로젝트입니다.

## 보안 주의사항

- 실제 API 키는 반드시 환경변수로 설정해야 합니다.
- `application.yml`, Java 코드, JavaScript 코드, README, 문서 파일에 실제 키를 직접 작성하지 마세요.
- `.env`, `.env.*`, `*.pem`, `*.key` 파일은 Git 추적에서 제외되어 있습니다.
- 실수로 실제 키를 커밋했다면 즉시 해당 키를 폐기하고 새 키를 발급해야 합니다.
- 저장소를 Public으로 전환하기 전에는 GitHub Secret scanning 경고와 커밋 히스토리를 다시 확인하는 것이 좋습니다.

## 문서

추가 포트폴리오 문서는 `docs/` 폴더에 있습니다.

- `docs/VirtualIdol_Portfolio_Documentation.md`
- `docs/VirtualIdol_Portfolio_Documentation.docx`
- `docs/NOVA_MOMO_Portfolio_Development_Record.docx`

`scripts/create-portfolio-docx.ps1` 스크립트는 포트폴리오 문서를 Word 파일로 생성하기 위한 보조 스크립트입니다.

## 라이선스

현재 별도 라이선스 파일은 포함되어 있지 않습니다. 저장소를 공개하거나 외부에서 재사용할 수 있게 하려면 목적에 맞는 라이선스를 추가하는 것이 좋습니다.
