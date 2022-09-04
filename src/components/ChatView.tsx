import { findLastIndex } from 'lodash'
import React, { useContext, useEffect, useState } from 'react'

import {
  ConnectedMessage,
  DisconnectedMessage,
  EnteredMessage,
  LeftMessage,
  Message,
  MessageType
} from '../message'
import MessageView from './MessageView'

import { ServerSettings } from '../../server/src/types'
import '../../style/chat.css'
import {
  ActivateAutoscrollAction,
  DeactivateAutoscrollAction
} from '../Actions'
import { DispatchContext } from '../App'
import { MessageList } from './MessageList'

type MovementMessageType =
  | ConnectedMessage
  | DisconnectedMessage
  | EnteredMessage
  | LeftMessage;

const movementMessageTypes = [
  MessageType.Connected,
  MessageType.Disconnected,
  MessageType.Entered,
  MessageType.Left
]

const isMovementMessage = (message: Message): message is MovementMessageType =>
  movementMessageTypes.includes(message.type)

interface Props {
  messages: Message[];
  autoscrollChat: boolean;
  serverSettings: ServerSettings;
  captionsEnabled: boolean;
}

export default function ChatView (props: Props) {
  // const dispatch = useContext(DispatchContext)

  // const handleScroll = () => {
  //   const messageWindow = document.querySelector('#messages')
  //   const isScrolledToBottom =
  //     messageWindow.scrollHeight ===
  //     messageWindow.scrollTop + messageWindow.clientHeight

  //   if (isScrolledToBottom && !props.autoscrollChat) {
  //     dispatch(ActivateAutoscrollAction())
  //   } else if (!isScrolledToBottom && props.autoscrollChat) {
  //     dispatch(DeactivateAutoscrollAction())
  //   }
  // }

  useEffect(() => {
    const lastMessage = document.querySelector(
      '#messages .message-wrapper:last-of-type'
    )
    if (lastMessage && props.autoscrollChat) {
      // I was using lastMessage.scrollIntoView()
      // But I was seeing odd behavior when there was only one message on-screen.
      // This very TS-unfriendly code fixes taht.
      (lastMessage.parentNode as Element).scrollTop =
        (lastMessage as any).offsetTop -
        (lastMessage.parentNode as any).offsetTop
    }
  })

  const [shouldShowOlderMessages, setShouldShowOlderMessages] =
    useState(false)

  // This message filtering logic is kinda ugly and hard to read
  function shouldRemoveMessage (m: Message) {
    return (
      isMovementMessage(m) &&
      (props.serverSettings.movementMessagesHideRoomIds.includes(m.roomId) ||
        m.numUsersInRoom > props.serverSettings.movementMessagesHideThreshold)
    )
  }
  const messages = props.messages
    .filter((msg) => {
      // Hide movement messages if the room is busy enough
      return !shouldRemoveMessage(msg)
    })
    .filter((msg) => {
      // Don't show captions unless they're enabled
      if (props.captionsEnabled) return true
      return msg.type !== MessageType.Caption
    })

  const lastIndexOfMovedMessage = findLastIndex(
    messages,
    (message) => message.type === MessageType.MovedRoom
  )
  const currentRoomMessages = messages.slice(lastIndexOfMovedMessage)
  const shownMessages = shouldShowOlderMessages
    ? messages
    : currentRoomMessages

  return (
    <>
      <button
        className="link-styled-button"
        onClick={() => setShouldShowOlderMessages(!shouldShowOlderMessages)}
      >
        {shouldShowOlderMessages ? 'Hide' : 'Show'} Older Messages
      </button>
      <div id="messages">
        <MessageList messages={shownMessages} />
      </div>
    </>
  )
}
