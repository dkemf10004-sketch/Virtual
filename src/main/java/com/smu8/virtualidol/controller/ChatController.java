package com.smu8.virtualidol.controller;

import com.smu8.virtualidol.dto.ChatRequest;
import com.smu8.virtualidol.dto.ChatResponse;
import com.smu8.virtualidol.service.OpenAiService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final OpenAiService openAiService;

    public ChatController(OpenAiService openAiService) {
        this.openAiService = openAiService;
    }

    @PostMapping
    public ChatResponse chat(@RequestBody(required = false) ChatRequest request) {
        String reply = openAiService.ask(request == null ? null : request.messages());

        return new ChatResponse(reply);
    }
}
