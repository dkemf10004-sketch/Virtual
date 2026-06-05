package com.smu8.virtualidol.dto;

import java.util.List;

public record ChatRequest(
        List<ChatMessage> messages
) {
}
