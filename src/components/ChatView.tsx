import { findLastIndex } from 'lodash'
import React, { useContext, useEffect, useState } from 'react'

import { isMovementMessage, Message, MessageType } from '../message'

import { ServerSettings } from '../../server/src/types'
import '../../style/chat.css'
import { SendMessageAction } from '../Actions'
import { DispatchContext } from '../App'
import { MessageList } from './MessageList'

/**
 * necessary because TypeScript doesn't know we're in a browser context
 *
 * @see node_modules/typescript/lib/lib.dom.d.ts
 * @see node_modules/@types/node/globals.d.ts
 */
declare function setTimeout(
  handler: TimerHandler,
  timeout?: number,
  ...arguments: any[]
): number;
declare function clearTimeout(id: number | undefined): void;

interface Props {
  messages: Message[];
  autoscrollChat: boolean;
  serverSettings: ServerSettings;
  captionsEnabled: boolean;
}

/**
 * explicitly adding `stopDebugMessageDispatcher` to the window so I can stop
 * this thing after a few messages if I want to inspect stuff
 */
declare global {
  interface Window {
    stopDebugMessageDispatcher: () => void;
  }
}

let timeoutId = 0
if (process.env.NODE_ENV === 'development') {
  window.stopDebugMessageDispatcher = () => clearTimeout(timeoutId)
}

const useDebugMessageDispatcher = () => {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const dispatch = useContext(DispatchContext)

  useEffect(() => {
    const dispatchMessage = () =>
      dispatch(SendMessageAction(`The time is now ${new Date()}.`))

    // let timeoutId = 0
    const scheduleMessage = () => {
      timeoutId = setTimeout(
        () => {
          dispatchMessage()
          scheduleMessage()
        },
        // sends a message every 5 + 0..10 seconds
        (5 + Math.round(Math.random() * 10)) * 1_000
      )
    }

    scheduleMessage()
    return () => clearTimeout(timeoutId)
  }, [])
}

export default function ChatView (props: Props) {
  useDebugMessageDispatcher()

  const [shouldShowOlderMessages, setShouldShowOlderMessages] = useState(false)

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
        <MessageList
          messages={shownMessages}
          autoscroll={props.autoscrollChat}
        />
      </div>
    </>
  )
}
