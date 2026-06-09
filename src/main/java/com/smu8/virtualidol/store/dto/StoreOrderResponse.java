package com.smu8.virtualidol.store.dto;

import com.smu8.virtualidol.store.model.StoreOrder;

import java.time.Instant;
import java.util.List;

public class StoreOrderResponse {
    private final String orderId;
    private final String customerName;
    private final String customerEmail;
    private final List<StoreOrderItemResponse> items;
    private final int itemCount;
    private final int productsAmount;
    private final int shippingFee;
    private final int totalAmount;
    private final String paymentMethod;
    private final String paymentStatus;
    private final String orderStatus;
    private final Instant createdAt;
    private final Instant paidAt;

    public StoreOrderResponse(StoreOrder order) {
        this.orderId = order.getOrderId();
        this.customerName = order.getCustomerName();
        this.customerEmail = order.getCustomerEmail();
        this.items = order.getItems().stream().map(StoreOrderItemResponse::new).toList();
        this.itemCount = order.getItemCount();
        this.productsAmount = order.getProductsAmount();
        this.shippingFee = order.getShippingFee();
        this.totalAmount = order.getTotalAmount();
        this.paymentMethod = order.getPaymentMethod();
        this.paymentStatus = order.getPaymentStatus();
        this.orderStatus = order.getOrderStatus();
        this.createdAt = order.getCreatedAt();
        this.paidAt = order.getPaidAt();
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

    public List<StoreOrderItemResponse> getItems() {
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
}
