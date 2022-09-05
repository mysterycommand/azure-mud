import { findLastIndex } from 'lodash'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

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
  DeactivateAutoscrollAction,
  SendMessageAction
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

declare function setTimeout(
  handler: TimerHandler,
  timeout?: number,
  ...arguments: any[]
): number;
declare function clearTimeout(id: number | undefined): void;

let timeoutId = 0
window.stop = () => clearTimeout(timeoutId)

export default function ChatView (props: Props) {
  const dispatch = useContext(DispatchContext)

  // useful for debugging
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
