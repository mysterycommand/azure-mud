import React, { FC, useContext } from 'react'
import { MessagesContext } from '../../App'
import { MessageType } from '../../message'
import MessageView from '../MessageView'

interface MessageItemProps {
  id: string;
  hideTimestamp: boolean;
  msgIndex: number;
}

export const MessageItem: FC<MessageItemProps> = ({
  id,
  hideTimestamp,
  msgIndex
}) => {
  const messages = useContext(MessagesContext)

  return (
    <li>
      {messages.entities[id].type === MessageType.MovedRoom && <hr />}
      <MessageView
        message={messages.entities[id]}
        id={id}
        hideTimestamp={hideTimestamp}
        msgIndex={msgIndex}
      />
    </li>
  )
}
