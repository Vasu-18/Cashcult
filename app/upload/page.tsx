"use client"

import React, { FormEvent, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Header from '../components/Header'
import { BackgroundCircles } from '../components/design/Hero'
import Section from '../components/Section'
import background from '@/assets/grid.png'
import Image from 'next/image'
import curve from "@/assets/hero/curve.png"
import FileUploader from '../components/FileUploader'
import Button from '../components/Button'
import { uploadFileToAppwrite } from '@/lib/actions/upload-actions'
import { parseWorkflowFile } from '@/lib/utils'

const Upload = () => {
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    if (!user?.primaryEmailAddress?.emailAddress) {
      setMessage({ type: 'error', text: 'User email not found' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      formData.append('file', file)

      // Parse and log uploaded file data before uploading
      const hourlyCostValue = Number(formData.get('average-hourly-cost')) || 0
      const parsed = await parseWorkflowFile(file, hourlyCostValue)
      if (!parsed.success) {
        setMessage({ type: 'error', text: parsed.error || 'Failed to parse file' })
        setLoading(false)
        return
      }
      console.log('Parsed file data:', parsed.data)

      const result = await uploadFileToAppwrite(formData, user.primaryEmailAddress.emailAddress)

      if (result.success) {
        setMessage({ type: 'success', text: 'File uploaded successfully!' })
        // Reset form
        form.reset()
        setFile(null)
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-auto bg-[#0E0C15]">
      <Header />

      <div className="relative">
        <Image
          src={background}
          alt='bg'
          className='absolute top-15 left-0 h-full w-full object-cover opacity-60'
        />

        <div className="relative z-10 container mx-auto pt-32 pb-20">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h1 className="font-semibold text-[2.5rem] leading-13
              md:text-[2.75rem] md:leading-15
              lg:text-[3.25rem] lg:leading-16.25
              xl:text-[3.75rem] xl:leading-18 mb-6"
            >
              Prioritize the earnings by uploading your problems {' '}
              <span className="inline-block relative">
                here
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
              Unleash the power of AI within DollarSaver. Upgrade your productivity
              with DollarSaver, the open AI chat app.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Success/Error Message */}
            {message && (
              <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                {message.text}
              </div>
            )}

            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Team Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="team-name" className="text-sm font-medium text-n-1">
                  Team Name
                </label>
                <input
                  type="text"
                  name="team-name"
                  placeholder="Enter your team name"
                  id="team-name"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-n-8 border border-n-6 text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workflow-type"
                  className="text-sm font-medium text-n-1"
                >
                  Workflow Type
                </label>

                <select
                  id="workflow-type"
                  name="workflow-type"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-lg border  bg-[#0E0C15] px-4 py-3 text-[#FFFFFF] transition-all duration-200 focus:border-color-1 focus:outline-none"
                >
                  <option value="" disabled>
                    Select workflow type
                  </option>
                  <option value="Deployments">Deployments</option>
                  <option value="Pull_Requests">Pull Requests</option>
                  <option value="Tasks">Tasks</option>
                  <option value="Incidents">Incidents</option>
                  <option value="Build_failures">Build Failures</option>
                  <option value="Reviews">Reviews</option>
                </select>
              </div>


              {/* Average Hourly Cost */}
              <div className="flex flex-col gap-2">
                <label htmlFor="average-hourly-cost" className="text-sm font-medium text-n-1">
                  Average Hourly Cost
                </label>
                <input
                  type='number'
                  name="average-hourly-cost"
                  placeholder="Enter average hourly cost in USD..."
                  id="average-hourly-cost"
                  required
                  step="1"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-4 py-3 rounded-lg bg-n-8 border border-n-6 text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-all duration-200"
                />
              </div>

              {/* File Uploader */}
              <div className="flex flex-col gap-2">
                <label htmlFor="uploader" className="text-sm font-medium text-n-1">
                  Upload Asset File
                </label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              {/* Submit Button */}
              <button
                className='w-full rounded-lg bg-linear-to-r from-[#FF98E2] to-[#9C4DFF] py-3 text-white font-semibold transition hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                type='submit'
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Analyze'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload