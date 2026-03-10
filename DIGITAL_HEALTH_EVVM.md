# Digital Health EVVM

**An OpenClaw framework for clinical agentic engineering.**

---

## Disclaimer

**This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or government body.**

---

## Network

- **Chain:** Base Sepolia (testnet)
- **Chain ID:** 84532
- **RPC:** `https://sepolia.base.org`
- **Explorer:** https://sepolia-explorer.base.org

## Deploy this EVVM

1. **Prerequisites:** [Foundry](https://getfoundry.sh/), [Bun](https://bun.sh/) ≥ 1.0, Git.

2. **Install dependencies** (from repo root):
   ```bash
   bun install
   forge install
   ```

3. **Import wallet** (use a Base Sepolia-funded key):
   ```bash
   cast wallet import defaultKey --interactive
   ```

4. **Deploy:**
   ```bash
   bun run evvm deploy
   ```
   (Or build a native binary: `bun run build-macos` then `./evvm deploy`.)
   When prompted:
   - **EVVM Name:** `Digital Health EVVM`
   - **Principal Token Name / Symbol:** e.g. `Digital Health MATE` / `DHM` (or keep defaults)
   - **Admin / Golden Fisher / Activator:** your addresses (can be the same for testing)

5. **Register in EVVM Registry** (optional): when the CLI asks, choose `y`. You need a small amount of **ETH on Ethereum Sepolia** for the registration tx (see [QuickStart](https://www.evvm.info/docs/QuickStart)). To register later: `bun run evvm register --coreAddress <your-core-address>`.

6. **Optional:** Add `ETHERSCAN_API` (Basescan API key) to `.env` for contract verification.

## References

- [EVVM Documentation](https://www.evvm.info/llms-full.txt)
- [QuickStart Guide](https://www.evvm.info/docs/QuickStart)
- [EVVM Registry](https://sepolia.etherscan.io/address/0x389dC8fb09211bbDA841D59f4a51160dA2377832) (Ethereum Sepolia)
