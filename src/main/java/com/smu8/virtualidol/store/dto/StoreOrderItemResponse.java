package com.smu8.virtualidol.store.dto;

import com.smu8.virtualidol.store.model.StoreOrderItem;

public class StoreOrderItemResponse {
    private final String productId;
    private final String name;
    private final int price;
    private final int quantity;
    private final int subtotal;

    public StoreOrderItemResponse(StoreOrderItem item) {
        this.productId = item.getProductId();
        this.name = item.getName();
        this.price = item.getPrice();
        this.quantity = item.getQuantity();
        this.subtotal = item.getSubtotal();
    }

    public String getProductId() {
        return productId;
    }

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getSubtotal() {
        return subtotal;
    }
}
