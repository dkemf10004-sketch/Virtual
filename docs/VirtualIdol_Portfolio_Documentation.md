# VirtualIdol 포트폴리오 개발 문서

작성 기준일: 2026-06-23  
프로젝트 경로: `C:\Users\KOSMO\IdeaProjects\VirtualIdol`  
문서 목적: 개발회사 제출용 포트폴리오 설명 자료

## 1. 프로젝트 개요

VirtualIdol은 가상의 엔터테인먼트 회사 `NOVA Entertainment`와 AI 버추얼 어시스턴트 `MOMO AI`를 중심으로 만든 웹 기반 데모 프로젝트이다. 단순한 소개 페이지가 아니라, 방문자가 메인 페이지에서 콘텐츠를 탐색하고, AI 챗봇에게 질문하고, Live2D 캐릭터와 상호작용하며, 굿즈 쇼룸과 주문/결제 목업까지 경험할 수 있도록 구성했다.

이 프로젝트는 Spring Boot 백엔드와 정적 프론트엔드를 결합한 형태로 구현되었다. 백엔드는 채팅 API와 스토어 주문 API를 제공하고, 프론트엔드는 랜딩 페이지, AI 챗봇 UI, Live2D Companion, 굿즈 섹션, 굿즈 상세 모달, 장바구니/주문 테스트 화면을 담당한다.

## 2. 개발 목표

- AI와 팬 경험이 결합된 버추얼 아이돌/엔터테인먼트 서비스 콘셉트를 웹으로 표현한다.
- 메인 페이지, 아티스트, 굿즈, 오디션, 뉴스, 문의 영역을 하나의 브랜드 경험으로 연결한다.
- OpenAI API를 이용해 방문자 질문에 응답하는 MOMO AI 챗봇을 구현한다.
- 챗봇 응답과 Live2D 캐릭터 표현을 연결해 더 생동감 있는 안내 경험을 만든다.
- 굿즈 상품 탐색, 장바구니, 주문 생성, 결제 승인 목업을 구현해 서비스 확장 가능성을 보여준다.
- 개발 과정에서 생긴 한계와 개선 지점을 문서화해 다음 개발 단계로 이어질 수 있게 한다.

## 3. 사용 기술 및 구조

### 백엔드

- Java 21
- Spring Boot 4.0.6
- Spring Web MVC
- Java `HttpClient` 기반 OpenAI Responses API 호출
- Jackson 기반 JSON 직렬화/역직렬화
- 인메모리 주문 저장소: `ConcurrentHashMap`

### 프론트엔드

- HTML, CSS, Vanilla JavaScript
- 정적 파일 서빙: `src/main/resources/static`
- Live2D 렌더링: Cubism Core, PixiJS, pixi-live2d-display CDN
- 브라우저 저장소: `localStorage` 기반 장바구니/주문 테스트 데이터

### 주요 파일

- `pom.xml`: Spring Boot, Java 버전, 웹 의존성 정의
- `src/main/java/com/smu8/virtualidol/VirtualIdolApplication.java`: 애플리케이션 진입점
- `src/main/java/com/smu8/virtualidol/controller/ChatController.java`: `/api/chat` 엔드포인트
- `src/main/java/com/smu8/virtualidol/service/OpenAiService.java`: OpenAI API 연동 및 응답 추출
- `src/main/java/com/smu8/virtualidol/store/controller/StoreOrderController.java`: 스토어 주문 API
- `src/main/java/com/smu8/virtualidol/store/service/StoreOrderService.java`: 상품 카탈로그, 주문 생성, 결제 승인 로직
- `src/main/resources/static/index.html`: NOVA Entertainment 메인 페이지
- `src/main/resources/static/app.js`: 챗봇, 섹션 이동, 오디션 모달, 굿즈 연동 로직
- `src/main/resources/static/live2d-companion.js`: Live2D Companion 초기화, 표시, 드래그, 상태 제어
- `src/main/resources/static/goods/`: 굿즈 쇼룸 페이지
- `src/main/resources/static/store-test/`: 장바구니 및 주문/결제 테스트 페이지
- `src/main/resources/static/assets/`: 캐릭터, 굿즈 이미지, 히어로 영상 리소스
- `src/main/resources/static/live2d-models/`: Live2D 모델, 모션, 표정, 텍스처 리소스

## 4. 개발 진행 흐름

현재 Git 로그에는 2026-06-05부터 2026-06-09까지 `Initial commit`, `2차본`, `3차본`, `4차 수정`, `5차 수정`, `6차 수정`, `7차 수정` 형태의 단계적 작업 기록이 남아 있다. 커밋 메시지가 상세하지 않은 부분이 있어 일부 세부 순서는 현재 파일 구조와 기능 완성도를 기준으로 재구성했다.

### 1단계: Spring Boot 프로젝트 기반 생성

처음에는 Spring Boot 애플리케이션 골격을 만들고 `pom.xml`, Maven Wrapper, 기본 테스트 파일, `application.yml`을 구성했다. 서버 포트는 8080으로 설정했고, OpenAI API 키와 모델명은 환경변수 기반으로 주입하도록 했다.

이 단계의 핵심은 정적 웹 페이지와 API를 한 프로젝트 안에서 제공할 수 있는 기반을 만드는 것이었다. 프론트엔드는 별도 빌드 도구 없이 Spring Boot의 `static` 디렉터리에서 바로 제공되도록 구성했다.

### 2단계: NOVA Entertainment 메인 페이지 제작

메인 화면은 `index.html`과 `style.css`를 중심으로 구성했다. `hero`, `artists`, `goods`, `audition`, `news`, `contact` 섹션을 만들고, 가상의 엔터테인먼트 회사와 버추얼 아이돌 서비스를 소개하는 구조로 정리했다.

히어로 영역에는 영상 배경 `assets/videos/hero-bg.mp4`를 배치했고, 아티스트 카드, 뉴스 카드, 오디션 지원 영역을 통해 실제 기업 홈페이지처럼 보이는 기본 경험을 만들었다. 이후 챗봇과 Live2D, 굿즈 기능이 이 메인 페이지 위에 단계적으로 결합되었다.

### 3단계: MOMO AI 챗봇 UI 및 API 설계

프론트엔드에서는 `app.js`에 챗봇 패널 열기/닫기, 메시지 입력, 대화 로그 출력, 전송 중 상태 표시 로직을 구현했다. 사용자가 메시지를 입력하면 브라우저에서 `/api/chat`으로 대화 목록을 전송하고, 응답을 다시 챗봇 로그와 말풍선에 반영한다.

백엔드에서는 `ChatController`가 `ChatRequest`를 받아 `OpenAiService`에 전달하고, `ChatResponse`로 응답한다. `OpenAiService`는 OpenAI Responses API를 호출하며, 최근 메시지 10개만 추려 입력으로 사용해 대화 맥락을 유지하면서도 요청 크기를 제한한다.

### 4단계: 사이트 정보 기반 AI 안내 기능 강화

`OpenAiService`는 `static/data/site-info.json`을 읽어 AI instructions에 포함한다. 이를 통해 MOMO AI가 사이트 섹션, 굿즈 상품명, 가격, 등록 여부 같은 정보를 현재 데모 페이지 기준으로 안내하도록 설계했다.

또한 시스템 지시문에는 “실제 SM, YG, JYP 같은 회사의 내부 정보를 아는 것처럼 말하지 않기”, “모르는 내용은 확인 어렵다고 말하기”, “한국어 중심 응답” 등의 조건을 넣었다. 포트폴리오 관점에서는 AI 응답 품질뿐 아니라 환각 방지와 서비스 톤 제어를 고려한 지점이다.

### 5단계: 챗봇과 페이지 액션 연결

`app.js`에는 사용자의 문장 안에서 키워드를 감지해 페이지 동작으로 연결하는 `SITE_ACTIONS` 구조가 있다. 예를 들어 “굿즈”, “상품”, “스토어” 같은 단어가 들어오면 굿즈 섹션으로 스크롤하고, “머그컵”이나 “티셔츠”가 들어오면 해당 상품 카드를 강조한다.

이 기능은 AI 응답만 보여주는 챗봇에서 한 단계 더 나아가, 웹 페이지 자체를 조작하는 안내 어시스턴트 경험을 만들기 위해 추가되었다. 사용자가 원하는 정보를 말로 요청하면 챗봇이 해당 위치로 안내하고 Live2D 캐릭터도 함께 말하는 구조다.

### 6단계: Live2D Companion 통합

`live2d-companion.js`와 `live2d-companion.css`를 추가해 MOMO 캐릭터를 Live2D Companion 형태로 표시했다. 외부 CDN으로 Cubism Core, PixiJS, pixi-live2d-display를 로드하고, `live2d-models/mao_pro/runtime/mao_pro.model3.json`을 기반으로 모델을 초기화한다.

Live2D 기능에는 다음 구현이 포함되어 있다.

- 모델 로딩 전 라이브러리와 모델 파일 접근 가능 여부 확인
- PixiJS 렌더러 생성 및 투명 배경 캔버스 사용
- 화면 크기에 맞춘 모델 스케일 조정
- 드래그 가능한 캐릭터 위치 이동
- 창 크기 변경 시 모델 재배치
- 챗봇 응답을 Live2D 말풍선에 동기화
- thinking/error 상태 표현

### 7단계: 굿즈 쇼룸 및 상세 모달 구현

메인 페이지의 `goods` 섹션에는 MOMO Mug, MOMO Cap, MOMO Pillow, MOMO Mouse Pad, MOMO Blanket, MOMO T-Shirt 상품을 배치했다. 각 상품은 이미지, 카테고리, 설명, 가격, 상세 보기, 장바구니 추가 버튼을 가진다.

`app.js`에서는 상품 카드 데이터를 읽어 상세 모달을 동적으로 생성한다. 사용자가 `View Detail`을 누르면 상품 이미지와 설명을 확대해서 보여주고, `Add to Cart`를 누르면 `localStorage`에 장바구니 정보를 저장한 뒤 스토어 테스트 페이지로 이동한다.

별도 굿즈 페이지인 `static/goods/`는 태그 필터와 상품 카드 렌더링 구조를 갖고 있어, 메인 페이지의 쇼룸보다 더 확장된 상품 목록 페이지로 사용할 수 있다.

### 8단계: 장바구니와 주문/결제 목업 개발

`store-test/` 페이지는 `localStorage` 기반으로 장바구니, 수량 변경, 삭제, 주문 내역 표시, 결제 완료 화면을 테스트한다. 결제 수단은 실제 결제 연동이 아니라 KakaoPay Test와 같은 목업 시나리오로 구성되어 있다.

백엔드에서도 `StoreOrderController`와 `StoreOrderService`를 통해 주문 API를 제공한다. 핵심 엔드포인트는 다음과 같다.

- `POST /api/store/orders`: 주문 생성
- `POST /api/store/payments/mock/approve`: 목업 결제 승인
- `GET /api/store/orders`: 주문 목록 조회
- `GET /api/store/orders/{orderId}`: 단건 주문 조회

`StoreOrderService`는 상품 카탈로그를 서버에 보유하고, 주문 생성 시 상품 ID와 수량을 검증한다. 주문은 `ord_` 접두어와 UUID 기반 ID를 갖고, 기본 상태는 `READY`/`PENDING`이며 목업 결제 승인 후 `MOCK_PAID`/`COMPLETED`로 변경된다.

### 9단계: UX 개선과 운영성 보강

챗봇 패널에는 드래그와 리사이즈 기능이 들어갔다. 큰 화면에서는 사용자가 패널 위치와 크기를 조절할 수 있고, 모바일에서는 화면 크기에 맞춰 안정적으로 동작하도록 분기했다.

섹션 이동 경험도 개선했다. `wheel` 이벤트를 감지해 `hero`, `artists`, `goods`, `audition`, `news`, `contact` 섹션 단위로 부드럽게 이동하도록 구현했다. 단, 챗봇/모달/입력 요소 안에서는 휠 이동이 방해되지 않도록 예외 셀렉터를 두었다.

오디션 문의 모달은 입력 폼 유효성 검사와 제출 후 안내 메시지를 포함한다. 실제 서버 저장은 아직 없지만, 포트폴리오 단계에서는 사용자 흐름과 UI 완성도를 보여주는 목업 기능으로 의미가 있다.

## 5. 기능별 구현 상세

### AI 채팅

사용자가 챗봇에 메시지를 입력하면 프론트엔드는 현재까지의 대화 배열을 `/api/chat`으로 전송한다. 서버는 최근 메시지를 문자열 형태로 정리해 OpenAI Responses API에 전달한다. 응답은 `output_text`를 우선 확인하고, 없을 경우 `output[].content[].text` 구조를 순회해 추출한다.

오류 처리도 포함되어 있다. API 키가 비어 있으면 안내 메시지를 반환하고, API 호출 실패 시 상태 코드와 응답 일부를 반환한다. 예외 발생 시에도 서버 오류 메시지를 사용자에게 보여주도록 했다.

### Live2D Companion

Live2D Companion은 사용자가 챗봇을 열거나 `MOMO Live` 버튼을 누를 때 화면에 나타난다. 챗봇이 응답을 기다리는 동안 thinking 상태를 적용하고, 응답이 도착하면 말풍선 텍스트를 갱신한다.

단순히 모델을 띄우는 것에 그치지 않고, 모델 로딩 실패 상태 표시, 반응형 리사이즈, 드래그 위치 조정, 히트박스 계산을 구현했다. 이는 외부 라이브러리 기반 기능을 실제 UI 흐름에 맞게 통합한 사례다.

### 굿즈/스토어

굿즈 기능은 메인 페이지 쇼룸, 별도 굿즈 페이지, 스토어 테스트 페이지, 백엔드 주문 API로 나뉜다. 프론트엔드에서는 사용자가 상품을 보고 장바구니에 담는 경험을 제공하고, 백엔드에서는 서버 기준 상품 카탈로그와 주문 검증 구조를 제공한다.

현재 주문 저장은 DB가 아니라 인메모리 구조이므로 서버 재시작 시 데이터가 사라진다. 포트폴리오에서는 “결제/주문 도메인 흐름을 설계하고 목업으로 검증했다”는 범위로 설명하는 것이 적절하다.

## 6. API 요약

| 구분 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| AI 채팅 | POST | `/api/chat` | 사용자 대화 목록을 받아 MOMO AI 응답 반환 |
| 주문 생성 | POST | `/api/store/orders` | 고객 정보와 상품 목록으로 주문 생성 |
| 결제 승인 | POST | `/api/store/payments/mock/approve` | 목업 결제 승인 처리 |
| 주문 목록 | GET | `/api/store/orders` | 생성된 주문 목록 조회 |
| 주문 상세 | GET | `/api/store/orders/{orderId}` | 특정 주문 상세 조회 |

## 7. 데이터 모델 요약

### 채팅

- `ChatMessage`: role, content
- `ChatRequest`: messages
- `ChatResponse`: reply

### 스토어

- `StoreProduct`: 상품 ID, 이름, 가격
- `StoreOrderItem`: 상품 ID, 이름, 가격, 수량, 소계
- `StoreOrder`: 주문 ID, 고객명, 이메일, 주문 항목, 배송비, 총액, 결제 상태, 주문 상태, 생성/결제 시각
- `CreateOrderRequest`: 고객 정보, 결제 수단, 주문 상품 목록
- `ApprovePaymentRequest`: 승인할 orderId
- `StoreOrderResponse`: 클라이언트 응답용 주문 데이터

## 8. 검증 및 테스트 관점

현재 프로젝트에는 기본 Spring Boot 테스트 파일이 존재한다. 기능 검증은 주로 브라우저에서 직접 페이지를 열어 다음 흐름을 확인하는 방식으로 진행할 수 있다.

- 메인 페이지가 정상 표시되는지 확인
- 챗봇 패널 열기/닫기, 메시지 전송, 오류 표시 확인
- OpenAI API 키가 없을 때 안내 메시지가 반환되는지 확인
- Live2D 모델 리소스 체크와 로딩 상태 확인
- 굿즈 상세 모달 열기/닫기 확인
- 장바구니 추가, 수량 변경, 삭제, 주문 완료 흐름 확인
- 백엔드 주문 API의 요청 검증과 오류 응답 확인

향후에는 `StoreOrderService` 단위 테스트, `ChatController` MVC 테스트, 프론트엔드 핵심 유저 플로우에 대한 Playwright 테스트를 추가하는 것이 좋다.

## 9. 현재 한계와 개선 계획

### 현재 한계

- 일부 정적 JSON/JS 문자열에 한글 인코딩이 깨진 흔적이 있다.
- OpenAI 모델 기본값이 `gpt-5.5`로 되어 있어 실제 사용 가능한 모델명인지 운영 전 확인이 필요하다.
- 스토어 주문 데이터는 인메모리 저장 방식이라 서버 재시작 시 유지되지 않는다.
- 결제는 실제 결제 연동이 아닌 목업 승인 방식이다.
- 오디션 문의 폼은 실제 저장/전송 기능 없이 프론트엔드 목업으로 동작한다.
- API 키가 없을 때 챗봇 응답은 정상 안내되지만, 운영 환경 설정 문서가 아직 충분하지 않다.

### 개선 계획

- 깨진 한글 문자열을 UTF-8 기준으로 정리하고, 정적 데이터 파일을 검수한다.
- OpenAI 모델명을 실제 운영 모델로 교체하고, 공식 문서 기준 설정값을 정리한다.
- 주문 저장소를 H2 또는 MySQL/PostgreSQL 등 DB 기반으로 전환한다.
- 실제 결제 API 연동 전 결제 상태 머신과 실패/취소 케이스를 확장한다.
- 오디션 문의 데이터를 서버 API와 DB에 저장하도록 구현한다.
- README를 보강해 실행 방법, 환경변수, API 예시, 데모 시나리오를 문서화한다.
- 테스트 코드를 추가해 포트폴리오 신뢰도를 높인다.

## 10. 포트폴리오에서 강조할 수 있는 역량

- Spring Boot 기반 REST API 설계와 예외 처리
- OpenAI API 연동 및 프롬프트/컨텍스트 구성
- 정적 프론트엔드와 백엔드 API 통합
- Live2D, PixiJS 등 외부 라이브러리 통합 경험
- 사용자 행동 기반 페이지 액션 처리
- 굿즈/주문/결제 흐름을 도메인 모델로 설계한 경험
- 브라우저 저장소와 서버 저장소의 역할 차이를 이해하고 목업에서 API 구조로 확장한 경험
- 포트폴리오 프로젝트의 한계를 식별하고 다음 개발 단계로 연결하는 문서화 역량

## 11. 제출용 요약 문장

VirtualIdol은 AI 버추얼 아이돌 어시스턴트와 엔터테인먼트 브랜드 페이지를 결합한 Spring Boot 기반 웹 프로젝트입니다. 메인 페이지, MOMO AI 챗봇, Live2D 캐릭터, 굿즈 쇼룸, 장바구니/주문/결제 목업을 하나의 흐름으로 연결했으며, OpenAI API 연동과 프론트엔드 상호작용, 스토어 도메인 설계를 함께 경험할 수 있도록 구현했습니다.

