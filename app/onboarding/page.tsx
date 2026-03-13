"use client"

import React, { FormEvent, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import background from '@/assets/grid.png'
import Image from 'next/image'
import curve from "@/assets/hero/curve.png"
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const Onboarding = () => {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const createUser = useMutation(api.users.createUser)
  const createClient = useMutation(api.client.createClient)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      setMessage({ type: 'error', text: 'User not found' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      const businessName = formData.get('business-name') as string
      const clientName = formData.get('client-name') as string
      const workingIndustry = formData.get('working-industry') as string

      // Step 1 — Save user to Convex
      const userId = await createUser({
        clerkId: user.id,
        businessName,
        industry: workingIndustry,
      })

      // Step 2 — Save client to Convex
      await createClient({
        userId,
        clientName,
      })

      // Step 3 — Mark onboarding complete in Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
        },
      })

      setMessage({ type: 'success', text: 'Setup complete! Redirecting...' })

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-auto bg-[#0E0C15]">
      <div className="relative">
        <Image
          src={background}
          alt='bg'
          className='absolute top-0 left-0 h-full w-full object-cover opacity-60'
        />

        <div className="relative z-10 container mx-auto pt-20 pb-20">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-[#AC6AFF] mb-4">
              Welcome to CashCult
            </p>
            <h1 className="font-semibold text-[2.5rem] leading-13
              md:text-[2.75rem] md:leading-15
              lg:text-[3.25rem] lg:leading-16.25
              xl:text-[3.75rem] xl:leading-18 mb-6"
            >
              Let&apos;s set up your workspace{' '}
              <span className="inline-block relative">
                now
                <Image
                  src={curve}
                  className="absolute top-full left-0 w-full xl:-mt-2"
                  width={624}
                  height={28}
                  alt="Curve"
                />
              </span>
            </h1>

            <p className="body-2 text-n-3 max-w-2xl mx-auto">
              Tell us a bit about your business so CashCult can start predicting your cash flow.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {message && (
              <div className={`mb-4 p-4 rounded-lg ${message.type === 'success'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
                }`}>
                {message.text}
              </div>
            )}

            <form id="onboarding-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Business Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="business-name" className="text-sm font-medium text-n-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="business-name"
                  placeholder="Enter your business name"
                  id="business-name"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-n-8 border border-n-6 text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-all duration-200"
                />
              </div>

              {/* Client Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="client-name" className="text-sm font-medium text-n-1">
                  Client Name
                </label>
                <input
                  type="text"
                  name="client-name"
                  placeholder="Enter your client name"
                  id="client-name"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-n-8 border border-n-6 text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-all duration-200"
                />
              </div>

              {/* Working Industry */}
              <div className="flex flex-col gap-2">
                <label htmlFor="working-industry" className="text-sm font-medium text-n-1">
                  Working Industry
                </label>
                <select
                  id="working-industry"
                  name="working-industry"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-lg border bg-[#0E0C15] px-4 py-3 text-[#FFFFFF] transition-all duration-200 focus:border-color-1 focus:outline-none"
                >
                  <option value="" disabled>Select your industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Real_Estate">Real Estate</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Submit */}
              <button
                className='w-full rounded-lg bg-linear-to-r from-[#FF98E2] to-[#9C4DFF] py-3 text-white font-semibold transition hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                type='submit'
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding