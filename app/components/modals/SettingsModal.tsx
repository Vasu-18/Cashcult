"use client"

import Modal, { FormGroup, FormInput, FormSelect, ModalFooter } from "./Modal"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <form onSubmit={handleSubmit}>
        <FormGroup label="Business Name">
          <FormInput type="text" defaultValue="Arjun's Design Agency" />
        </FormGroup>

        <FormGroup label="Industry">
          <FormSelect defaultValue="Design Agency">
            <option>Design Agency</option>
            <option>Technology</option>
            <option>Retail</option>
            <option>Manufacturing</option>
            <option>Consulting</option>
          </FormSelect>
        </FormGroup>

        <FormGroup label="Minimum Safe Cash Threshold (₹)">
          <FormInput type="number" defaultValue="800000" />
        </FormGroup>

        <FormGroup label="Currency">
          <FormSelect defaultValue="₹ INR">
            <option>₹ INR</option>
            <option>$ USD</option>
            <option>€ EUR</option>
          </FormSelect>
        </FormGroup>

        <ModalFooter onClose={onClose} submitLabel="Save Changes" />
      </form>
    </Modal>
  )
}
