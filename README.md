# Oobit Crypto Balance System

## Description
The **Crypto Balance System** is a microservices-based application built with **NestJS**. It consists of two services:

- **Rate Service**: Fetches and stores cryptocurrency exchange rates.
- **Balance Service**: Manages user balances and performs balance-related calculations.

## Features
- Retrieves cryptocurrency exchange rates.
- Stores coins IDs with unsupported market data for tracking.
- Manages user balances, including adding, removing, and rebalancing assets.
- Calculates total balance in a specified currency.

## Prerequisites
Ensure you have the following installed:
- **Node.js** (v18.13 or later)

## Installation

1. Clone the repository:
   ```sh
   git clone https://https://github.com/moshe56561/oobit-crypto-balance-system-moshe-iftach.git
   cd your-project-folder
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory and add the following environment variables:
   ```env
   # Balance Service
   BALANCE_SERVICE_NAME=BALANCE_SERVICE
   BALANCE_SERVICE_HOST=localhost
   BALANCE_SERVICE_PORT=3001

   # Rate Service
   RATE_SERVICE_NAME=RATE_SERVICE
   RATE_SERVICE_HOST=localhost
   RATE_SERVICE_PORT=3000

   # Base application currency
   BASE_CURRENCY=USD
   ```

## Running the Project

- Start both services together:
  ```sh
  npm run start:all
  ```
- Start services individually:
  ```sh
  npm run start:rate   # Start Rate Service
  npm run start:balance # Start Balance Service
  ```

> **Note:** Do **not** use `npm run dev` or any other commands, as they are not supported.

## API Endpoints

### **Balance Service**
- `POST /balance/rebalance` - Rebalance a user's portfolio.
- `GET /balance/total/usd` - Get total balance in USD.
- `GET /balance` - Get all balances for a specific user.
- `POST /balance/add` - Add balance to a user account.
- `DELETE /balance/remove` - Remove balance from a user account.
- `GET /balance/total-all/:currency` - Get total balance for all users in a specific currency.
- `GET /balance/all` - Get all users' balances.

### **User Availability**
There is no need for registration, but a user will not be available until a balance is added using the `POST /balance/add` endpoint. Until a user is added through this endpoint, other balance-related API endpoints might not work.


## Data Storage
Data is stored in JSON files inside the `data` folder:
```sh
/data/rates.json                   # Stores cryptocurrency exchange rates
/data/unsupported-market-data-ids.json  # Stores unsupported market data IDs
/data/user-balances.json           # Stores user balances
```

## Testing
To run the tests, use the following command:
```sh
npm run test
```

## Postman Collection
For convenience, a **Postman import file** is included in the submission to test the API endpoints easily via email.

