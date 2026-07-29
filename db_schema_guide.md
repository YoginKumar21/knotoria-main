# Firestore Database Schema Guide for Storefront

This document outlines the collections, fields, data types, and purposes of the documents stored in your Firestore database to help you connect and build your public e-commerce storefront.

---

## 1. `products` Collection
Each document in this collection represents a single item for sale.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | The product's display title. |
| `description` | `string` | Detailed product copy/description. |
| `category` | `string` | The category name matching one of the predefined options (e.g. `"Plump Plushies"`, `"Forever Bouquets"`). |
| `price` | `number` | The selling price of the item (e.g. `29.99`). |
| `stock` | `number` | Available inventory quantity (integer). |
| `sku` | `string` | Unique product identifier (e.g. `KN-PLUSH-4812`). |
| `isActive` | `boolean` | Set to `true` if the item should be visible/purchasable on the storefront. |
| `imageUrls` | `array (objects)` | Array of image objects. Each object contains:<br>• `url` (string): Secure Cloudinary image URL.<br>• `publicId` (string): Cloudinary asset identifier. |
| `images` | `array (strings)` | Array of plain URL strings (used for legacy compatibility with older components). |
| `hasVariants` | `boolean` | Hardcoded to `false` (simple products only). |
| `createdAt` | `timestamp` | Firestore server timestamp when the product was created. |
| `updatedAt` | `timestamp` | Firestore server timestamp when the product was last updated. |

---

## 2. `orders` Collection
Each document represents a customer purchase transaction.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` or `null` | Reference to the Document ID in the `users` collection. Omitted/null for guest checkout. |
| `status` | `string` | Progress status. Standard values: `"pending"`, `"processing"`, `"shipped"`, `"delivered"`, `"cancelled"`. |
| `totalAmount` | `number` | Total price of the transaction (items + shipping/taxes). |
| `items` | `array (objects)` | List of purchased items. Each item contains:<br>• `productId` (string): Firestore ID of the product.<br>• `name` (string): Snapshot of the product name at purchase.<br>• `price` (number): Price of the product at purchase.<br>• `quantity` (number): Quantity purchased. |
| `address` | `object` | Customer shipping details containing:<br>• `email` (string)<br>• `phone` (string)<br>• `street` (string)<br>• `city` (string)<br>• `postalCode` (string) |
| `estimatedDeliveryDate` | `string` or `null` | Optional tracking date updated by administration (e.g. `"2026-07-28"`). |
| `createdAt` | `timestamp` | Timestamp when the order was placed. |
| `updatedAt` | `timestamp` | Timestamp when the order was last modified. |

---

## 3. `users` Collection
Each document stores registration details and privileges for a user.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | User's full display name. |
| `email` | `string` | User's email address. |
| `phone` | `string` | Contact phone number. |
| `role` | `string` | Role identifier. Values: `"user"` (default customer) or `"admin"` (access to admin panel). |
