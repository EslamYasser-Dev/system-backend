# Fintech Backend System

A backend system for handling digital product purchases with wallet and payment gateway integration.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User, Merchant)

- **Wallet System**
  - Deposit/Withdraw funds
  - Transaction history
  - Secure balance management

- **Product Management**
  - Create and manage digital products
  - Inventory management
  - Merchant-specific product management

- **Order Processing**
  - Create and manage orders
  - Multiple payment methods (Wallet, Stripe)
  - Order status tracking

- **Payment Processing**
  - Wallet payments
  - Stripe integration
  - Webhook handling

## Tech Stack

- **Backend**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT
- **Payment Processing**: Stripe
- **Caching**: Redis (for future implementation)

## Setup

1. **Prerequisites**
   - Node.js (v22+)
   - PostgreSQL
   - npm or yarn

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn