import React, { FC } from 'react'

import './MessageItem.css'

export const MessageItem: FC = ({ children }) => (
  <li className="message-item">{children}</li>
)
