'use client'
import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

export function useSocket(): Socket {
  const socket = getSocket()
  const ref = useRef(socket)
  useEffect(() => () => { ref.current.disconnect() }, [])
  return socket
}
