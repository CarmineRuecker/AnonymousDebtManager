import React from 'react'

interface StatusMessageProps {
  message: string
  isError?: boolean
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, isError = false }) => {
  return (
    <div className={`status-message ${isError ? 'error' : 'success'}`}>
      <span>{isError ? '❌' : '✅'}</span> {message}
    </div>
  )
}

export default StatusMessage