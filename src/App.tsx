import { useState } from 'react'
import './App.css'
import Microphone from './components/Microphone'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>ERIDIAN COMMUNICATION INTERFACE</h1>
      <p>Awaiting human input...</p>

      <Microphone />
    </main>
  )
}
export default App
