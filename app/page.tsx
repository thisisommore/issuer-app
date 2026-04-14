"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import { web3Enable, web3Accounts, web3FromAddress } from '@polkadot/extension-dapp'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { stringToU8a, u8aToHex } from '@polkadot/util'
import { HexString } from "@polkadot/util/types";
import { encodeAddress } from '@polkadot/util-crypto'
import { formatBalance } from '@polkadot/util'

export default function Home() {
  const [signature, setSignature] = useState<HexString>()
  const [account, setAccount] = useState<string>()
  const [transfers, setTransfers] = useState<{ from: string; amount: string; memo: string | null }[]>([])
  const unsubRef = useRef<(() => void) | null>(null)
  const apiRef = useRef<ApiPromise | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.()
      apiRef.current?.disconnect()
    }
  }, [])

  const toast = useCallback(async () => {
    // --- Signing (client side, browser wallet) ---
    await web3Enable('Haven')
    const accounts = await web3Accounts()
    const acct = accounts[0]
    const xxAddress = encodeAddress(acct.address, 55) // xx network prefix
    setAccount(xxAddress)
    const injector = await web3FromAddress(acct.address)
    const message = stringToU8a('Haven wallet verification: <nonce or timestamp>')

    if (injector.signer.signRaw) {
      // const { signature } = await injector.signer.signRaw({
      //   address: acct.address,
      //   data: u8aToHex(message),
      //   type: 'bytes'
      // })
      // setSignature(signature)
    }

    // --- Connect and listen for transfers + memo ---
    if (!apiRef.current) {
      const provider = new WsProvider('wss://api-xxnetwork.n.dwellir.com/3cfec1a9-dd5a-47bb-b7dc-310c4dd2a30a')
      apiRef.current = await ApiPromise.create({ provider })
    }
    const api = apiRef.current

    formatBalance.setDefaults({ decimals: 9, unit: 'XX' })
    // Unsub previous listener if any
    unsubRef.current?.()

    const unsub = await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
      const at = await api.at(header.hash)
      const events = await at.query.system.events() as unknown as any[]

      events.forEach(({ event, phase }) => {
        if (!api.events.balances.Transfer.is(event)) return

        const [from, to, amount] = event.data
        console.table({from: from.toString(), to: to.toString(), amount: formatBalance(amount.toString())});
        
        if (to.toString() !== xxAddress) return

        const extrinsicIndex = phase.asApplyExtrinsic.toNumber()
        // const remark = events.find(
        //   (e: any) =>
        //     e.phase.isApplyExtrinsic &&
        //     e.phase.asApplyExtrinsic.toNumber() === extrinsicIndex &&
        //     api.events.system.Remarked.is(e.event)
        // )

        // const memo = remark ? remark.event.data[1].toHuman() : null

        setTransfers((prev) => [...prev, {
          from: from.toString(),
          amount: formatBalance(amount.toString()),
          memo: "NA"
        }])
      })
    })

    unsubRef.current = unsub
  }, [])

  return (
    <div>
      <button onClick={toast} className="text-5xl">Verify</button>
      {account && <p>Account: {account}</p>}
      {signature && <p>Signature: {signature}</p>}
      {transfers.length > 0 && (
        <div>
          <h2 className="text-2xl mt-4">Transfers</h2>
          {transfers.map((t, i) => (
            <div key={i} className="border p-2 my-1">
              <p>From: {t.from}</p>
              <p>Amount: {t.amount}</p>
              {t.memo && <p>Memo: {t.memo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}