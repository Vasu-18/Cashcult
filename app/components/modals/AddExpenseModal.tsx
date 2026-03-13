import { useState } from "react"
import Modal, { FormGroup, FormInput, FormSelect, ModalFooter } from "./Modal"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface AddExpenseModalProps {
  open: boolean
  onClose: () => void
}

export default function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [category, setCategory] = useState("Rent")
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const createExpense = useMutation(api.data.createExpense)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await createExpense({
        userId: "user-placeholder" as any,
        description,
        amount: Number(amount),
        dueDate: date,
        category,
        isRecurring,
      })
      onClose()
      setDescription("")
      setAmount("")
      setDate("")
    } catch (err) {
      console.error("Failed to save expense:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit}>
        <FormGroup label="Description">
          <FormInput 
            type="text" 
            placeholder="e.g. Office Rent, AWS Server" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Amount (₹)">
          <FormInput 
            type="number" 
            placeholder="e.g. 120000" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormGroup>

        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Due Date">
            <FormInput 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Category">
            <FormSelect 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
              <option>Salary</option>
              <option>Rent</option>
              <option>Software</option>
              <option>Vendor</option>
              <option>Other</option>
            </FormSelect>
          </FormGroup>
        </div>

        <div className="flex items-center gap-2.5 mb-4">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-emerald-400"
          />
          <label htmlFor="recurring" className="text-[12px] font-bold text-slate-400 cursor-pointer">
            Recurring monthly
          </label>
        </div>

        <ModalFooter onClose={onClose} submitLabel={isSaving ? "Saving..." : "Save Expense"} />
      </form>
    </Modal>
  )
}
