# x402 DHM server (EVVM)

Minimal x402-style server that returns **402 Payment Required** for protected resources and accepts **DHM payments** via EVVM Core (signed `pay()` + executor).

## Quick test run

1. **Start the server** (from this directory):

   ```bash
   pnpm install
   pnpm dev
   ```

   If port 8080 is in use, use another port:

   ```bash
   PORT=8081 pnpm dev
   ```

2. **Point the frontend** at this server:

   - In `frontend/.env` set:
     ```env
     VITE_X402_SERVER_URL=http://localhost:8081
     ```
     (or `http://localhost:8080` if the server runs on 8080.)

3. **Run the frontend** and open **“Test x402 server (DHM)”**:
   - Click **“Fetch protected resource (MRI slot)”** → you should see a 402 and a “Pay 0.1 DHM” button.
   - Connect wallet (Base Sepolia), ensure you have DHM (use the faucet in EVVM Core section).
   - Click **“Pay 0.1 DHM”** → sign the EVVM message → the server will submit the payment and return the unlocked content.

4. **For the payment to succeed**, the server must be able to submit the transaction:
   - Copy `server/.env.example` to `server/.env`.
   - Set `EXECUTOR_PRIVATE_KEY` to a **Base Sepolia** private key that:
     - Has a little ETH for gas, and
     - Is registered as a **staker** on EVVM Core (so it can call `pay()` as `senderExecutor`).
   - Without `EXECUTOR_PRIVATE_KEY`, the server still returns 402 and payment options, but `POST /payments/evvm/dhm` will return 500.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (200 + `{ status, chainId }`). |
| GET | `/clinical/mri-slot` | Protected resource. Returns **402** with DHM payment options (and `PAYMENT-REQUIRED: 1`). |
| POST | `/payments/evvm/dhm` | Submit signed EVVM `pay()` intent; server executes on Core and returns content on success. |

## Env vars (see `.env.example`)

- `PORT` – default 8080
- `RPC_URL` – Base Sepolia RPC
- `EVVM_ID`, `EVVM_CORE_ADDRESS`, `DHM_TOKEN_ADDRESS` – EVVM config
- `RECIPIENT_ADDRESS` – DHM recipient for the protected resource (e.g. MRI/Equipment agent)
- `EXECUTOR_PRIVATE_KEY` – account that submits `pay()` on-chain (must be staker; needs ETH for gas)

## Deploy to Fly.io

The app is **evvm-x402-dhm**; URL: **https://evvm-x402-dhm.fly.dev**.

From the `server/` directory:

```bash
# If the app doesn't exist yet: fly apps create evvm-x402-dhm
fly secrets set EXECUTOR_PRIVATE_KEY=0x...
fly secrets set RPC_URL=https://sepolia.base.org
# optional: RECIPIENT_ADDRESS, EVVM_CORE_ADDRESS, EVVM_ID, DHM_TOKEN_ADDRESS
fly deploy
```

Then set `VITE_X402_SERVER_URL=https://evvm-x402-dhm.fly.dev` in `frontend/.env`.
