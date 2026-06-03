import { useState } from 'react'
import { useAuthStore } from './store/auth.store'
import { usePosStore } from './store/pos.store'
import { LoginPage } from './pages/LoginPage'
import { ShiftPage } from './pages/ShiftPage'
import { PosPage } from './pages/PosPage'

type Screen = 'shift' | 'pos'

export default function App() {
  const { isAuthenticated } = useAuthStore()
  const { shiftOpened } = usePosStore()
  const [screen, setScreen] = useState<Screen>(shiftOpened ? 'pos' : 'shift')

  if (!isAuthenticated()) return <LoginPage onLogin={() => setScreen('shift')} />
  if (screen === 'shift') return <ShiftPage onShiftOpen={() => setScreen('pos')} />
  return <PosPage />
}
