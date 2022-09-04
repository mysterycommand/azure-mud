import React, { FC } from 'react'
import { Message } from '../../../message'
import { MessageItem } from '../MessageItem'
import { messageId } from '../utils'

import './MessageList.css'

interface MessageListProps {
  messages: Message[];
}

export const MessageList: FC<MessageListProps> = ({ messages }) => {
  return (
    <ol className="message-list">
      {messages.map((message, i) => (
        <MessageItem
          key={messageId(message)}
          message={message}
          hideTimestamp={false}
          msgIndex={i}
        />
      ))}
    </ol>
  )
}
