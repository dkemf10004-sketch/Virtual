# VirtualIdol

AI virtual idol agency demo built with Spring Boot, OpenAI API integration, Live2D companion UI, and a mock goods store/order flow.

## Overview

VirtualIdol is a portfolio-style web application for a fictional entertainment company named **NOVA Entertainment**. The site presents a virtual idol/AI assistant experience centered around **MOMO AI**.

The project combines a static frontend served by Spring Boot with backend REST APIs for AI chat and mock store orders. Visitors can explore the agency page, chat with MOMO AI, view a Live2D-style companion, browse MOMO goods, add products to a cart, and test a mock order/payment flow.

## Main Features

- NOVA Entertainment landing page with hero, artist, goods, audition, news, and contact sections
- MOMO AI chat panel powered by OpenAI Responses API
- Site-aware AI responses using `src/main/resources/static/data/site-info.json`
- Live2D companion widget using Cubism/PixiJS-related frontend assets
- MOMO goods catalog with product cards, detail modal, and cart entry points
- Separate goods page under `/goods/`
- Store test page under `/store-test/`
- Mock backend order API with in-memory order storage
- Mock payment approval endpoint for portfolio/demo testing
- Environment-variable based API key configuration

## Tech Stack

### Backend

- Java 21
- Spring Boot 4.0.6
- Spring Web MVC
- Maven Wrapper
- Java `HttpClient`
- Jackson JSON handling
- In-memory store order storage with `ConcurrentHashMap`

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Static resources served from `src/main/resources/static`
- Browser `localStorage` for cart/order demo state
- Live2D model assets in `src/main/resources/static/live2d-models`

## Project Structure

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

## Requirements

- JDK 21 or newer
- Internet connection when using MOMO AI chat
- OpenAI API key for AI chat responses

The main page and store demo can be opened without an OpenAI API key. The chat endpoint returns a friendly configuration message when `OPENAI_API_KEY` is not set.

## Configuration

Application settings are defined in `src/main/resources/application.yml`.

```yaml
server:
  port: 8080

openai:
  api-key: ${OPENAI_API_KEY:}
  model: ${OPENAI_MODEL:gpt-5.5}
```

Set environment variables before running the app:

### PowerShell

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
$env:OPENAI_MODEL="your_model_name_here"
.\mvnw.cmd spring-boot:run
```

### macOS/Linux

```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_MODEL="your_model_name_here"
./mvnw spring-boot:run
```

Do not commit real API keys. This repository ignores `.env`, `.env.*`, `*.pem`, and `*.key` files.

## Running Locally

From the project root:

```powershell
.\mvnw.cmd spring-boot:run
```

Then open:

- Main page: `http://localhost:8080/`
- Goods page: `http://localhost:8080/goods/`
- Store test page: `http://localhost:8080/store-test/`
- Live2D test page: `http://localhost:8080/live2d-test.html`

## Build and Test

Run tests:

```powershell
.\mvnw.cmd test
```

Build the application:

```powershell
.\mvnw.cmd package
```

Run the packaged jar:

```powershell
java -jar target/VirtualIdol-0.0.1-SNAPSHOT.jar
```

## Main Pages

### `/`

The main NOVA Entertainment demo page. It includes the landing sections, MOMO goods preview, chat UI, audition/contact modals, and Live2D companion entry points.

### `/goods/`

A dedicated goods catalog page for MOMO products.

### `/store-test/`

A mock store flow used to test cart, order creation, and payment approval behavior.

### `/live2d-test.html`

A separate Live2D loading and interaction test page.

## REST API

### AI Chat

```http
POST /api/chat
Content-Type: application/json
```

Request:

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

Response:

```json
{
  "reply": "..."
}
```

The backend sends recent conversation messages to the OpenAI Responses API. It also includes current site information from `static/data/site-info.json` so MOMO AI can answer questions about the demo page and goods list.

### Create Store Order

```http
POST /api/store/orders
Content-Type: application/json
```

Request:

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

### Approve Mock Payment

```http
POST /api/store/payments/mock/approve
Content-Type: application/json
```

Request:

```json
{
  "orderId": "ord_example"
}
```

### Get Orders

```http
GET /api/store/orders
```

### Get One Order

```http
GET /api/store/orders/{orderId}
```

## Store Catalog

The backend currently supports the following product IDs:

| Product ID | Name | Price |
| --- | --- | ---: |
| `momo-mug` | MOMO Mug | 18000 |
| `momo-cap` | MOMO Cap | 29000 |
| `momo-pillow` | MOMO Pillow | 32000 |
| `momo-mousepad` | MOMO Mouse Pad | 24000 |
| `momo-blanket` | MOMO Blanket | 49000 |
| `momo-tshirt` | MOMO T-Shirt | 39000 |

Shipping fee is currently fixed at `3000`.

## Important Implementation Notes

- Orders are stored in memory. Restarting the server clears order data.
- Payment is a mock approval flow, not a real payment gateway integration.
- The frontend cart uses browser `localStorage`.
- Some static JSON/JavaScript content may need UTF-8 text cleanup before production use.
- The default OpenAI model value is read from `OPENAI_MODEL`; verify the model name before deployment.
- This is a demo/portfolio project, not a production commerce system.

## Security Notes

- Real API keys must be supplied through environment variables.
- Do not hard-code secrets in `application.yml`, Java files, JavaScript files, or documentation.
- `.env`, `.env.*`, `*.pem`, and `*.key` are ignored by Git.
- If a real key is ever committed, rotate the key immediately and remove it from Git history before making the repository public.

## Documentation

Additional portfolio documentation is stored in `docs/`.

- `docs/VirtualIdol_Portfolio_Documentation.md`
- `docs/VirtualIdol_Portfolio_Documentation.docx`
- `docs/NOVA_MOMO_Portfolio_Development_Record.docx`

The script `scripts/create-portfolio-docx.ps1` is used to generate Word documentation from project notes.

## License

No license file is currently included. Add a license before using this project for public distribution or reuse.
