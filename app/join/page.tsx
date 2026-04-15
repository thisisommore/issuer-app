"use client"

import Link from "next/link"
import { useState } from "react"

const HAVEN_DM_STRING =
  "haven-dm:eyJjbCI6IiNFNDMxN0YiLCJjbiI6ImxhZHlTdHJhd0NvbG9ueSIsImNzIjowLCJwIjoiZ1F1UWd5VzU0Q3ZHWHUyS2NORVVOeVpBZHhuRnpYWC9YM2M2T0x2aWNLWT0iLCJ0IjoxNDQ0NjExMTk3fQ=="

const STEPS = [
  {
    title: "Open chat",
    body: "In the left top bar, tap the chat icon.",
    image: "step_1.png",
  },
  {
    title: "New conversation",
    body: "Tap the plus icon.",
    image: "step_2.png",
  },
  {
    title: "Paste invite and start",
    body: "In the modal, tap Paste invite. Paste the full haven-dm: line from DM string above into the input field, then tap Start conversation.",
    image: "step_3.png",
  },
] as const

export default function JoinPage() {
  const [copied, setCopied] = useState(false)

  const copyDm = () => {
    navigator.clipboard.writeText(HAVEN_DM_STRING)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#0e0e0e] px-5 py-[60px] font-mono text-[#aaa]">
      <div className="flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-start gap-2">
            <span className="text-sm font-medium tracking-wide text-[#ddd]">
              privllm
            </span>
            <p className="text-[13px] leading-relaxed text-[#888]">
              Join this DM with the string below, then follow the steps.
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-[#666]">
            DM string
          </h2>
          <div className="flex flex-col gap-2.5 rounded-md bg-[#141414] p-3">
            <code className="block break-all text-[11px] leading-normal text-[#666] wrap-anywhere">
              {HAVEN_DM_STRING}
            </code>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={copyDm}
                className="rounded bg-transparent px-2.5 py-1 font-mono text-[11px] text-[#888] hover:bg-[#1a1a1a]"
              >
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-[#666]">
            How to join
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.image} className="flex min-w-0 flex-col gap-3">
                <div className="flex items-start gap-2 text-xs text-[#6b6]">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#6b6]" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium text-[#aaa]">
                      Step {i + 1}: {step.title}
                    </span>
                    <p className="text-[12px] leading-relaxed text-[#888]">
                      {step.body}
                    </p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-md bg-[#141414]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local screenshots; natural size */}
                  <img
                    src={`/${step.image}`}
                    alt={`Step ${i + 1}: ${step.title}`}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-[10px] text-[#333]">private by default</div>
      </div>
    </div>
  )
}
