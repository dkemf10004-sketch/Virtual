package com.smu8.virtualidol.store.model;

public class StoreOrderItem {
    private final String productId;
    private final String name;
    private final int price;
    private final int quantity;
    private final int subtotal;

    public StoreOrderItem(String productId, String name, int price, int quantity) {
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.subtotal = price * quantity;
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
