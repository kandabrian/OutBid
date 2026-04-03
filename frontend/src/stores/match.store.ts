import { create } from 'zustand'

interface MatchStore {
  roomId: string | null
  energy: number
  scores: [number, number]
  currentItem: number
  setRoom: (id: string) => void
  spendEnergy: (amount: number) => void
  updateScores: (scores: [number, number]) => void
  nextItem: () => void
}

export const useMatchStore = create<MatchStore>((set) => ({
  roomId: null,
  energy: 100,
  scores: [0, 0],
  currentItem: 0,
  setRoom: (id) => set({ roomId: id }),
  spendEnergy: (amount) => set((s) => ({ energy: s.energy - amount })),
  updateScores: (scores) => set({ scores }),
  nextItem: () => set((s) => ({ currentItem: s.currentItem + 1 })),
}))
