import React, { FC } from 'react'
import { Message } from '../../../message'
import MessageView from '../../MessageView'
import { messageId } from '../utils'

import './MessageItem.css'

interface MessageItemProps {
  message: Message;
  hideTimestamp: boolean;
  msgIndex: number;
}

export const MessageItem: FC<MessageItemProps> = ({
  message,
  hideTimestamp,
  msgIndex
}) => {
  return (
    <li className="message-item">
      <MessageView
        message={message}
        id={messageId(message)}
        hideTimestamp={hideTimestamp}
        msgIndex={msgIndex}
      />
    </li>
  )
}
