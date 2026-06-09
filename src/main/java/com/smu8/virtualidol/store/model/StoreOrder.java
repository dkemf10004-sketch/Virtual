package com.smu8.virtualidol.store.model;

import java.time.Instant;
import java.util.List;

public class StoreOrder {
    private final String orderId;
    private final String customerName;
    private final String customerEmail;
    private final List<StoreOrderItem> items;
    private final int itemCount;
    private final int productsAmount;
    private final int shippingFee;
    private final int totalAmount;
    private final String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private final Instant createdAt;
    private Instant paidAt;

    public StoreOrder(
            String orderId,
            String customerName,
            String customerEmail,
            List<StoreOrderItem> items,
            int shippingFee,
            String paymentMethod,
            Instant createdAt
    ) {
        this.orderId = orderId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.items = List.copyOf(items);
        this.itemCount = items.stream().mapToInt(StoreOrderItem::getQuantity).sum();
        this.productsAmount = items.stream().mapToInt(StoreOrderItem::getSubtotal).sum();
        this.shippingFee = shippingFee;
        this.totalAmount = this.productsAmount + shippingFee;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = "READY";
        this.orderStatus = "PENDING";
        this.createdAt = createdAt;
    }

    public String getOrderId() {
        return orderId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public List<StoreOrderItem> getItems() {
        return items;
    }

    public int getItemCount() {
        return itemCount;
    }

    public int getProductsAmount() {
        return productsAmount;
    }

    public int getShippingFee() {
        return shippingFee;
    }

    public int getTotalAmount() {
        return totalAmount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void markMockPaid(Instant paidAt) {
        this.paymentStatus = "MOCK_PAID";
        this.orderStatus = "COMPLETED";
        this.paidAt = paidAt;
    }
}
