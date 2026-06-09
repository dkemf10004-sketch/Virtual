package com.smu8.virtualidol.store.service;

import com.smu8.virtualidol.store.dto.ApprovePaymentRequest;
import com.smu8.virtualidol.store.dto.CreateOrderItemRequest;
import com.smu8.virtualidol.store.dto.CreateOrderRequest;
import com.smu8.virtualidol.store.dto.StoreOrderResponse;
import com.smu8.virtualidol.store.model.StoreOrder;
import com.smu8.virtualidol.store.model.StoreOrderItem;
import com.smu8.virtualidol.store.model.StoreProduct;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StoreOrderService {
    private static final int SHIPPING_FEE = 3000;

    private final Map<String, StoreProduct> catalog = Map.of(
            "momo-mug", new StoreProduct("momo-mug", "MOMO Mug", 18000),
            "momo-cap", new StoreProduct("momo-cap", "MOMO Cap", 29000),
            "momo-pillow", new StoreProduct("momo-pillow", "MOMO Pillow", 32000),
            "momo-mousepad", new StoreProduct("momo-mousepad", "MOMO Mouse Pad", 24000),
            "momo-blanket", new StoreProduct("momo-blanket", "MOMO Blanket", 49000),
            "momo-tshirt", new StoreProduct("momo-tshirt", "MOMO T-Shirt", 39000)
    );
    private final ConcurrentHashMap<String, StoreOrder> orders = new ConcurrentHashMap<>();

    public StoreOrderResponse createOrder(CreateOrderRequest request) {
        validateCreateOrderRequest(request);

        List<StoreOrderItem> orderItems = request.getItems().stream()
                .map(this::toOrderItem)
                .toList();

        String orderId = "ord_" + UUID.randomUUID().toString().replace("-", "");
        String paymentMethod = hasText(request.getPaymentMethod()) ? request.getPaymentMethod().trim() : "Mock Payment";
        StoreOrder order = new StoreOrder(
                orderId,
                request.getCustomerName().trim(),
                request.getCustomerEmail().trim(),
                orderItems,
                SHIPPING_FEE,
                paymentMethod,
                Instant.now()
        );

        orders.put(orderId, order);
        return new StoreOrderResponse(order);
    }

    public StoreOrderResponse approveMockPayment(ApprovePaymentRequest request) {
        if (request == null || !hasText(request.getOrderId())) {
            throw new IllegalArgumentException("orderId is required.");
        }

        StoreOrder order = findOrder(request.getOrderId().trim());
        if (!"MOCK_PAID".equals(order.getPaymentStatus())) {
            order.markMockPaid(Instant.now());
        }
        return new StoreOrderResponse(order);
    }

    public List<StoreOrderResponse> getOrders() {
        return orders.values().stream()
                .sorted(Comparator.comparing(StoreOrder::getCreatedAt).reversed())
                .map(StoreOrderResponse::new)
                .toList();
    }

    public StoreOrderResponse getOrder(String orderId) {
        if (!hasText(orderId)) {
            throw new IllegalArgumentException("orderId is required.");
        }
        return new StoreOrderResponse(findOrder(orderId.trim()));
    }

    private void validateCreateOrderRequest(CreateOrderRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        if (!hasText(request.getCustomerName())) {
            throw new IllegalArgumentException("customerName is required.");
        }

        if (!hasText(request.getCustomerEmail())) {
            throw new IllegalArgumentException("customerEmail is required.");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("items must not be empty.");
        }
    }

    private StoreOrderItem toOrderItem(CreateOrderItemRequest itemRequest) {
        if (itemRequest == null || !hasText(itemRequest.getProductId())) {
            throw new IllegalArgumentException("productId is required.");
        }

        if (itemRequest.getQuantity() <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0.");
        }

        String productId = itemRequest.getProductId().trim();
        StoreProduct product = catalog.get(productId);
        if (product == null) {
            throw new IllegalArgumentException("Unknown productId: " + productId);
        }

        return new StoreOrderItem(product.getId(), product.getName(), product.getPrice(), itemRequest.getQuantity());
    }

    private StoreOrder findOrder(String orderId) {
        StoreOrder order = orders.get(orderId);
        if (order == null) {
            throw new NoSuchElementException("Order not found: " + orderId);
        }
        return order;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
