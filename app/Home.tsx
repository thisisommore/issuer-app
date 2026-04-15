"use client"
import { useCallback, useRef, useState } from "react"
import {
  web3Enable,
  web3Accounts,
  web3FromAddress,
} from "@polkadot/extension-dapp"
import { encodeAddress } from "@polkadot/util-crypto"

type ConnectionState = "idle" | "connecting" | "connected" | "signing" | "done" | "error"

/** Challenge `expires_at` is issued_at + this many minutes (keep in sync with copy below). */
const CREDENTIAL_VALID_MINUTES = 5

export default function Home() {
  const [signature, setSignature] = useState<string>()
  const [account, setAccount] = useState<string>()
  const [state, setState] = useState<ConnectionState>("idle")
  const [error, setError] = useState<string>()
  const [doneError, setDoneError] = useState<string>()
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState(false)
  const acctRef = useRef<{ address: string; xxAddress: string } | null>(null)

  const connectWallet = useCallback(async () => {
    try {
      setState("connecting")
      setError(undefined)
      const extensions = await web3Enable("Haven")
      if (extensions.length === 0) {
        setError("No wallet extension found. Install the xx network or Polkadot extension.")
        setState("error")
        return
      }
      const accounts = await web3Accounts()
      if (accounts.length === 0) {
        setError("No accounts found. Create or import an account in your wallet extension.")
        setState("error")
        return
      }
      const acct = accounts[0]
      const xxAddress = encodeAddress(acct.address, 55)
      acctRef.current = { address: acct.address, xxAddress }
      setAccount(xxAddress)
      setState("connected")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to connect wallet"
      setError(msg)
      setState("error")
    }
  }, [])

  const signChallenge = useCallback(async (regenerate?: boolean) => {
    if (!acctRef.current) return
    const { address, xxAddress } = acctRef.current

    try {
      if (regenerate) {
        setRegenerating(true)
        setDoneError(undefined)
      } else {
        setState("signing")
      }
      setError(undefined)
      const injector = await web3FromAddress(address)
      const now = Date.now()
      const challenge = {
        action: "privllm-auth",
        nonce: crypto.randomUUID(),
        issued_at: now,
        expires_at: now + CREDENTIAL_VALID_MINUTES * 60 * 1000,
      }

      if (!injector.signer.signRaw) {
        const msg = "Wallet does not support raw signing"
        if (regenerate) {
          setDoneError(msg)
        } else {
          setError(msg)
          setState("connected")
        }
        return
      }

      const { signature: sig } = await injector.signer.signRaw({
        address: xxAddress,
        data: JSON.stringify(challenge),
        type: "payload",
      })

      const payload = { address: xxAddress, signature: sig, challenge }
      setSignature(Buffer.from(JSON.stringify(payload)).toString("base64"))
      setState("done")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signing failed"
      if (regenerate) {
        setDoneError(msg)
      } else {
        setError(msg)
        setState("connected")
      }
    } finally {
      if (regenerate) {
        setRegenerating(false)
      }
    }
  }, [])

  const copy = (text: string, kind: "addr" | "token") => {
    navigator.clipboard.writeText(text)
    if (kind === "addr") {
      setCopiedAddr(true)
      setTimeout(() => setCopiedAddr(false), 1200)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  const showConnect = state === "idle" || state === "error" || state === "connecting"
  const showSign = state === "connected" || state === "signing"
  const showDone = state === "done"

  const btnPrimary =
    "self-start rounded bg-[#D4943A] px-4 py-2 font-mono text-xs font-medium text-[#0e0e0e] disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="flex min-h-screen justify-center bg-[#0e0e0e] px-5 py-[60px] font-mono text-[#aaa]">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex flex-col items-start gap-2">
          <span className="text-sm font-medium tracking-wide text-[#ddd]">privllm</span>
          {account && (
            <span
              className="w-full cursor-pointer break-all text-[11px] text-[#666] wrap-anywhere"
              onClick={() => copy(account, "addr")}
            >
              {copiedAddr ? "✓" : account}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-lg py-4">
          {showConnect && (
            <>
              <p className="text-[13px] leading-relaxed text-[#888]">
                Connect your wallet to authenticate anonymously.
              </p>
              {error && (state === "error" || state === "idle") && (
                <p className="text-xs text-[#c45]">{error}</p>
              )}
              <button
                type="button"
                onClick={connectWallet}
                disabled={state === "connecting"}
                className={btnPrimary}
              >
                {state === "connecting" ? "Connecting…" : "Connect Wallet"}
              </button>
            </>
          )}

          {showSign && (
            <>
              <p className="text-[13px] leading-relaxed text-[#888]">
                Sign a challenge to create your anonymous credential.
              </p>
              {error && <p className="text-xs text-[#c45]">{error}</p>}
              <button
                type="button"
                onClick={() => signChallenge()}
                disabled={state === "signing"}
                className={btnPrimary}
              >
                {state === "signing" ? "Awaiting signature…" : "Sign Challenge"}
              </button>
            </>
          )}

          {showDone && signature && (
            <>
              <div className="flex items-center gap-2 text-xs text-[#6b6]">
                <span className="size-1.5 shrink-0 rounded-full bg-[#6b6]" />
                <span>Authenticated</span>
              </div>
              <p className="rounded-md bg-[#1a1510] px-3 py-2.5 text-xs leading-snug text-[#a85]">
                This credential expires {CREDENTIAL_VALID_MINUTES} minutes after it was
                issued. Use it before then.
              </p>
              {doneError && <p className="text-xs text-[#c45]">{doneError}</p>}
              <div className="flex flex-col gap-2.5 rounded-md bg-[#141414] p-3">
                <code className="block break-all text-[11px] leading-normal text-[#666] wrap-anywhere">
                  {signature}
                </code>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => signChallenge(true)}
                    disabled={regenerating}
                    className="rounded bg-[#D4943A] px-3 py-1 font-mono text-[11px] font-medium text-[#0e0e0e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {regenerating ? "Signing…" : "Regenerate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(signature, "token")}
                    disabled={regenerating}
                    className="rounded bg-transparent px-2.5 py-1 font-mono text-[#888] text-[11px] hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-[10px] text-[#333]">private by default</div>
      </div>
    </div>
  )
}
