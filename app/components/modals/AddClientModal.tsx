"use client"

import Modal, { FormGroup, FormInput, FormSelect, ModalFooter } from "./Modal"

interface AddClientModalProps {
  open: boolean
  onClose: () => void
}

export default function AddClientModal({ open, onClose }: AddClientModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Client">
      <form onSubmit={handleSubmit}>
        <FormGroup label="Client Name">
          <FormInput type="text" placeholder="e.g. Sharma Enterprises" />
        </FormGroup>

        <FormGroup label="Payment Terms">
          <FormSelect defaultValue="Net 30">
            <option>Net 15</option>
            <option>Net 30</option>
            <option>Net 45</option>
            <option>Net 60</option>
          </FormSelect>
        </FormGroup>

        <ModalFooter onClose={onClose} submitLabel="Add Client" />
      </form>
    </Modal>
  )
}
