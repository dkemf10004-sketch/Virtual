package com.smu8.virtualidol.service;

import com.smu8.virtualidol.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    private static final String RESPONSES_API_URL = "https://api.openai.com/v1/responses";
    private static final int MAX_RECENT_MESSAGES = 10;
    private static final int MAX_ERROR_BODY_LENGTH = 500;
    private static final String INSTRUCTIONS = """
            You are MOMO AI, the AI virtual YouTuber assistant for the NOVA Entertainment demo homepage.
            Guide visitors about artists, auditions, news, and company information shown on the demo page.
            Keep your tone friendly and bright, but not overly dramatic or cringe.
            If the user asks about coding or implementation, explain it in an easy and practical way.
            Do not speak as if you know internal information about real companies such as SM, YG, or JYP.
            Do not invent unknown facts. If information is unavailable, say: "\uD604\uC7AC \uB370\uBAA8 \uD398\uC774\uC9C0 \uAE30\uC900\uC73C\uB85C\uB294 \uD655\uC778\uC774 \uC5B4\uB824\uC6CC\uC694."
            Reply in Korean unless the user clearly asks for another language.
            """;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String ask(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return "\uC544\uC9C1 \uBA54\uC2DC\uC9C0\uAC00 \uC5C6\uC5B4\uC694.";
        }

        if (apiKey == null || apiKey.isBlank()) {
            return "OPENAI_API_KEY\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694.";
        }

        try {
            String requestBody = createRequestBody(messages);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESPONSES_API_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "\uC624\uD508AI API \uD638\uCD9C\uC774 \uC2E4\uD328\uD588\uC5B4\uC694. \uC0C1\uD0DC\uCF54\uB4DC: "
                        + response.statusCode()
                        + ", \uC751\uB2F5: "
                        + truncate(response.body());
            }

            return extractReply(response.body());
        } catch (Exception e) {
            return "AI \uD638\uCD9C \uC911 \uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694: " + e.getMessage();
        }
    }

    private String createRequestBody(List<ChatMessage> messages) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("instructions", INSTRUCTIONS);
        body.put("input", buildConversationInput(messages));

        return objectMapper.writeValueAsString(body);
    }

    private String buildConversationInput(List<ChatMessage> messages) {
        List<ChatMessage> recentMessages = recentMessages(messages);
        StringBuilder input = new StringBuilder();
        input.append("Recent conversation:\n");

        for (ChatMessage message : recentMessages) {
            if (message == null) {
                continue;
            }

            String role = safeText(message.role());
            String content = safeText(message.content());

            if (role.isBlank() && content.isBlank()) {
                continue;
            }

            input.append(role.isBlank() ? "unknown" : role)
                    .append(": ")
                    .append(content)
                    .append('\n');
        }

        return input.toString();
    }

    private List<ChatMessage> recentMessages(List<ChatMessage> messages) {
        List<ChatMessage> nonNullMessages = new ArrayList<>();

        for (ChatMessage message : messages) {
            if (message != null) {
                nonNullMessages.add(message);
            }
        }

        int fromIndex = Math.max(0, nonNullMessages.size() - MAX_RECENT_MESSAGES);
        return nonNullMessages.subList(fromIndex, nonNullMessages.size());
    }

    private String extractReply(String responseBody) throws IOException {
        if (responseBody == null || responseBody.isBlank()) {
            return "AI \uC751\uB2F5 \uD14D\uC2A4\uD2B8\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC5B4\uC694.";
        }

        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode outputText = root.get("output_text");

        if (outputText != null && outputText.isTextual() && !outputText.asText().isBlank()) {
            return outputText.asText();
        }

        JsonNode output = root.get("output");
        if (output != null && output.isArray()) {
            for (JsonNode outputItem : output) {
                JsonNode content = outputItem.get("content");

                if (content == null || !content.isArray()) {
                    continue;
                }

                for (JsonNode contentItem : content) {
                    JsonNode text = contentItem.get("text");

                    if (text != null && text.isTextual() && !text.asText().isBlank()) {
                        return text.asText();
                    }
                }
            }
        }

        return "AI \uC751\uB2F5 \uD14D\uC2A4\uD2B8\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC5B4\uC694.";
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }

        if (value.length() <= MAX_ERROR_BODY_LENGTH) {
            return value;
        }

        return value.substring(0, MAX_ERROR_BODY_LENGTH) + "...";
    }
}
