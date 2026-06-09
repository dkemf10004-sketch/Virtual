package com.smu8.virtualidol.store.controller;

import com.smu8.virtualidol.store.dto.ApprovePaymentRequest;
import com.smu8.virtualidol.store.dto.CreateOrderRequest;
import com.smu8.virtualidol.store.dto.ErrorResponse;
import com.smu8.virtualidol.store.dto.StoreOrderResponse;
import com.smu8.virtualidol.store.service.StoreOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/store")
public class StoreOrderController {
    private final StoreOrderService storeOrderService;

    public StoreOrderController(StoreOrderService storeOrderService) {
        this.storeOrderService = storeOrderService;
    }

    @PostMapping("/orders")
    public StoreOrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        return storeOrderService.createOrder(request);
    }

    @PostMapping("/payments/mock/approve")
    public StoreOrderResponse approveMockPayment(@RequestBody ApprovePaymentRequest request) {
        return storeOrderService.approveMockPayment(request);
    }

    @GetMapping("/orders")
    public List<StoreOrderResponse> getOrders() {
        return storeOrderService.getOrders();
    }

    @GetMapping("/orders/{orderId}")
    public StoreOrderResponse getOrder(@PathVariable String orderId) {
        return storeOrderService.getOrder(orderId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException error) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(error.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoSuchElementException error) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(error.getMessage()));
    }
}
