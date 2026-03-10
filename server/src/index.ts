import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { createWalletClient, createPublicClient, http, Hex, parseAbi, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// Base Sepolia chain config (chainId 84532)
const BASE_SEPOLIA = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RPC_URL || "https://sepolia.base.org"] }
  }
} as const;

// EVVM Core + DHM configuration
const EVVM_ID = BigInt(process.env.EVVM_ID || "1143");
const CORE_ADDRESS = (process.env.EVVM_CORE_ADDRESS ||
  "0xfE6Ad61c4d93366c79a1406bfE8838A11cF53734") as Hex;
const DHM_TOKEN = (process.env.DHM_TOKEN_ADDRESS ||
  "0x0000000000000000000000000000000000000001") as Hex;

// Recipient of DHM for this resource (e.g. MRI / Equipment Agent address)
const RECIPIENT_ADDRESS = (process.env.RECIPIENT_ADDRESS ||
  "0x81250D5e3fAbc8811c181B32A293144Cd4459b1b") as Hex; // default: treasury

// Executor account (acts as paymaster / fisher)
const EXECUTOR_PRIVATE_KEY = process.env.EXECUTOR_PRIVATE_KEY as Hex | undefined;

if (!EXECUTOR_PRIVATE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[evvm-x402-server] EXECUTOR_PRIVATE_KEY is not set. The server will advertise payment options but cannot execute payments.",
  );
}

const evvmCoreAbi = parseAbi([
  "function pay(address from,address to,string to_identity,address token,uint256 amount,uint256 priorityFee,address senderExecutor,uint256 nonce,bool isAsyncExec,bytes signature) external",
]);

const publicClient = createPublicClient({
  chain: BASE_SEPOLIA,
  transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
});

const walletClient = EXECUTOR_PRIVATE_KEY
  ? createWalletClient({
      account: privateKeyToAccount(EXECUTOR_PRIVATE_KEY),
      chain: BASE_SEPOLIA,
      transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
    })
  : undefined;

// In-memory store for demo content
const PROTECTED_CONTENT = {
  "/clinical/mri-slot": {
    title: "MRI Slot Reservation Confirmation",
    body: "Your OpenClaw MRI Agent has reserved an MRI slot. This is demo content served after DHM payment on EVVM.",
  },
} as const;

// Utility to build a simple 402 Payment Required response with DHM via EVVM
function paymentRequired(res: Response, resourcePath: string) {
  res.status(402);
  res.setHeader("PAYMENT-REQUIRED", "1");

  const suggestedNonce = String(BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000)));

  const body = {
    resource: resourcePath,
    description: "This resource requires a small DHM payment on EVVM Core (Base Sepolia).",
    to: RECIPIENT_ADDRESS,
    suggestedNonce,
    options: [
      {
        id: "dhm-evvm",
        type: "evvm_pay",
        chainId: BASE_SEPOLIA.id,
        evvmId: EVVM_ID.toString(),
        coreAddress: CORE_ADDRESS,
        token: DHM_TOKEN,
        to: RECIPIENT_ADDRESS,
        suggestedNonce,
        amount: "100000000000000000", // 0.1 DHM (18 decimals)
        priorityFee: "0",
        executor: walletClient?.account.address ?? null,
        isAsyncExec: true,
        uiHint:
          "Sign an EVVM pay() message with an async nonce; a fisher/executor will submit it on-chain and unlock this resource.",
      },
    ],
  };

  res.json(body);
}

// Step 1: Client requests protected resource
app.get("/clinical/mri-slot", (req: Request, res: Response) => {
  const paid = false;

  if (!paid) {
    return paymentRequired(res, "/clinical/mri-slot");
  }

  const content = PROTECTED_CONTENT["/clinical/mri-slot"];
  return res.json({
    status: "ok",
    content,
  });
});

// Step 2: Client posts signed EVVM pay() intent for DHM
app.post("/payments/evvm/dhm", async (req: Request, res: Response) => {
  if (!walletClient) {
    return res.status(500).json({ error: "Executor not configured on server" });
  }

  const {
    from,
    to,
    toIdentity,
    token,
    amount,
    priorityFee,
    executor,
    nonce,
    isAsyncExec,
    signature,
  } = req.body as {
    from: Hex;
    to: Hex;
    toIdentity: string;
    token: Hex;
    amount: string;
    priorityFee: string;
    executor: Hex;
    nonce: string;
    isAsyncExec: boolean;
    signature: Hex;
  };

  // Basic validation; x402 clients should pass the same fields they used for signing.
  if (!from || !to || !token || !amount || !signature) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const valueAmount = BigInt(amount);
    const valuePriorityFee = BigInt(priorityFee || "0");
    const valueNonce = BigInt(nonce);

    const data = encodeFunctionData({
      abi: evvmCoreAbi,
      functionName: "pay",
      args: [
        from,
        to,
        toIdentity || "",
        token,
        valueAmount,
        valuePriorityFee,
        executor,
        valueNonce,
        isAsyncExec,
        signature,
      ],
    });

    const hash = await walletClient.sendTransaction({
      to: CORE_ADDRESS,
      data,
      chain: BASE_SEPOLIA,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    const content = PROTECTED_CONTENT["/clinical/mri-slot"];

    return res.status(200).json({
      status: "paid",
      txHash: hash,
      content,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to execute EVVM payment", err);
    return res.status(500).json({ error: "Failed to execute EVVM payment" });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", chainId: BASE_SEPOLIA.id });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[evvm-x402-server] Listening on port ${PORT}`);
});

