"use client"
import Image from "next/image";
import { useCallback, useState } from "react";
import { web3Enable, web3Accounts, web3FromAddress } from '@polkadot/extension-dapp'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { stringToU8a, u8aToHex } from '@polkadot/util'
import { signatureVerify, cryptoWaitReady } from '@polkadot/util-crypto'
import { HexString } from "@polkadot/util/types";

export default function Home() {
  const [signature,setSignature] = useState<HexString>()
  const toast = useCallback(async () => {
    // --- Signing (client side, browser wallet) ---

    await web3Enable('Haven')
    const accounts = await web3Accounts()
    const account = accounts[0]
    const injector = await web3FromAddress(account.address)

    const message = stringToU8a('Haven wallet verification: <nonce or timestamp>')

    if(injector.signer.signRaw) {
          // The extension prompts the user to approve
          const { signature } = await injector.signer.signRaw({
            address: account.address,
            data: u8aToHex(message),
            type: 'bytes'  // important: 'bytes' wraps with <Bytes>...</Bytes> prefix
          })
          setSignature(signature)
    }


  }, [])
  return (
    <div>
          <button onClick={toast} className="text-5xl">Verify</button>
          {signature && <p>{signature}</p>}
    </div>
  );
}
