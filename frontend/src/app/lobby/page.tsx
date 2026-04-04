'use client'

import React, { useState } from 'react'
import { RoomCard, CreateRoomForm } from '@/components/lobby'
import { Card, Input, Button } from '@/components/ui'
import { Modal } from '@/components/ui'

// Mock data
const mockRooms = [
  {
    roomId: 'room-001',
    creatorName: 'ProBidder',
    entryFee: 500,
    playerCount: 1,
    maxPlayers: 2,
    status: 'waiting' as const,
  },
  {
    roomId: 'room-002',
    creatorName: 'StrategyKing',
    entryFee: 1000,
    playerCount: 2,
    maxPlayers: 2,
    status: 'active' as const,
  },
  {
    roomId: 'room-003',
    creatorName: 'CalmBidder',
    entryFee: 2500,
    playerCount: 1,
    maxPlayers: 2,
    status: 'waiting' as const,
  },
]

export default function LobbyPage() {
  const [rooms, setRooms] = useState(mockRooms)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateRoom = async (entryFee: number) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In real implementation, would create room via API
      console.log('Creating room with entry fee:', entryFee)
      setShowCreateModal(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!selectedRoomId) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Joining room:', selectedRoomId)
      setShowJoinModal(false)
      setSelectedRoomId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomId.includes(searchTerm),
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Lobby</h1>
          <p className="text-slate-400 mt-2">
            {rooms.length} active matches • Find a game or create your own
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
        >
          Create Match
        </button>
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by player name or room ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" className="sm:w-auto">
            Filter
          </Button>
        </div>
      </Card>

      {/* Room List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 text-lg">No matches found</p>
            <p className="text-slate-500">Create a new match to get started</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.roomId}
              {...room}
              onJoin={() => {
                setSelectedRoomId(room.roomId)
                setShowJoinModal(true)
              }}
              onView={() => {
                // Navigate to match watch page
                console.log('Viewing match:', room.roomId)
              }}
            />
          ))
        )}
      </div>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Match"
        size="md"
      >
        <CreateRoomForm onSubmit={handleCreateRoom} isLoading={isLoading} />
      </Modal>

      {/* Join Confirmation Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Match?"
        description={
          selectedRoomId
            ? `You're about to join room ${selectedRoomId.slice(0, 12)}...`
            : ''
        }
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setShowJoinModal(false)
                setSelectedRoomId(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isLoading}
              onClick={handleJoinRoom}
              className="flex-1"
            >
              Confirm Join
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Your entry fee will be held in escrow until the match completes. Are you sure you want
            to proceed?
          </p>
          <div className="bg-amber-900/20 border border-amber-700 p-3 rounded-lg">
            <p className="text-sm text-amber-300">
              ⚠️ Ensure you have sufficient balance before joining
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
