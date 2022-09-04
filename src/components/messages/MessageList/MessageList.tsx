import React, { FC } from 'react'
import { Message } from '../../../message'
import MessageView from '../../MessageView'
import { MessageItem } from '../MessageItem'
import { messageId } from '../utils'

import './MessageList.css'

interface MessageListProps {
  messages: Message[];
}

const THREE_MINUTES = 1_000 * 60 * 3
const shouldHideTimestamp = (
  message: Message,
  previousMessage: Message | undefined
): boolean =>
  previousMessage &&
  'userId' in previousMessage &&
  'userId' in message &&
  previousMessage.userId === message.userId &&
  new Date(message.timestamp).getTime() -
    new Date(previousMessage.timestamp).getTime() <
    THREE_MINUTES

export const MessageList: FC<MessageListProps> = ({ messages }) => {
  return (
    <ol className="message-list">
      {messages.map((message, i) => {
        const hideTimestamp = shouldHideTimestamp(message, messages[i - 1])

        return (
          <MessageItem key={messageId(message)}>
            <MessageView
              message={message}
              id={messageId(message)}
              hideTimestamp={hideTimestamp}
              msgIndex={i}
            />
          </MessageItem>
        )
      })}
    </ol>
  )
}
