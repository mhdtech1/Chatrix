import type { ChatMessage } from "@chatrix/chat-core";
import { Fragment, type RefObject, type ReactNode } from "react";
import { VirtualizedMessageList } from "../MessageList";
import { PlatformIcon } from "../common/PlatformIcon";
import {
  RoleBadge as UiRoleBadge,
  type RoleType as UiRoleType,
} from "../common/RoleBadge";

type TwitchBadgeAsset = {
  key: string;
  title: string;
  imageUrl: string;
};

type DisplayBadge =
  | {
      key: string;
      kind: "image";
      asset: TwitchBadgeAsset;
    }
  | {
      key: string;
      kind: "role";
      badge: {
        key: string;
        label: string;
        icon: string;
      };
    };

type MessageChunk =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "emote";
      name: string;
      url: string;
    };

type SourceLookup = {
  id: string;
};

export type ChatMessageFeedProps = {
  messageListRef: RefObject<HTMLDivElement | null>;
  renderedMessages: ChatMessage[];
  newestLocked: boolean;
  firstUnreadTimestamp: number;
  onScroll: (element: HTMLDivElement) => void;
  pauseAutoScroll: () => void;
  notePausedFeedActivity: () => void;
  twitchGlobalBadgeCatalog: Record<string, Record<string, TwitchBadgeAsset>>;
  twitchChannelBadgeCatalogByRoomId: Record<
    string,
    Record<string, Record<string, TwitchBadgeAsset>>
  >;
  onIdentitySelect: (identity: {
    username: string;
    displayName: string;
  }) => void;
  onInteraction: () => void;
  onMessageContextMenu: (event: MouseEvent, message: ChatMessage) => void;
  effectivePerformanceMode: boolean;
  sourceByPlatformChannel: Map<string, SourceLookup>;
  channelEmoteMapBySourceId: Record<string, Record<string, string>>;
  kickGlobalEmoteMap: Record<string, string>;
  globalEmoteMap: Record<string, string>;
  highlightKeywords: string[];
  resolveDisplayedBadgesForMessage: (
    message: ChatMessage,
    twitchGlobalBadgeCatalog: Record<string, Record<string, TwitchBadgeAsset>>,
    twitchChannelBadgeCatalogByRoomId: Record<
      string,
      Record<string, Record<string, TwitchBadgeAsset>>
    >,
  ) => DisplayBadge[];
  buildMessageChunks: (
    message: ChatMessage,
    resolveEmote: (token: string) => string | undefined,
  ) => MessageChunk[];
  messageTimestamp: (message: ChatMessage) => number;
  readCombinedChannels: (message: ChatMessage) => string[];
  asRecord: (value: unknown) => Record<string, unknown> | null;
  buildMessageJumpKey: (message: ChatMessage) => string;
  renderTextWithLinks: (text: string, keyPrefix: string) => ReactNode[];
  toUiRoleType: (key: string) => UiRoleType | null;
};

export function ChatMessageFeed({
  messageListRef,
  renderedMessages,
  newestLocked,
  firstUnreadTimestamp,
  onScroll,
  pauseAutoScroll,
  notePausedFeedActivity,
  twitchGlobalBadgeCatalog,
  twitchChannelBadgeCatalogByRoomId,
  onIdentitySelect,
  onInteraction,
  onMessageContextMenu,
  effectivePerformanceMode,
  sourceByPlatformChannel,
  channelEmoteMapBySourceId,
  kickGlobalEmoteMap,
  globalEmoteMap,
  highlightKeywords,
  resolveDisplayedBadgesForMessage,
  buildMessageChunks,
  messageTimestamp,
  readCombinedChannels,
  asRecord,
  buildMessageJumpKey,
  renderTextWithLinks,
  toUiRoleType,
}: ChatMessageFeedProps) {
  if (renderedMessages.length > 1000) {
    return (
      <div
        ref={messageListRef}
        className="message-list"
        onWheel={(event) => event.stopPropagation()}
        onScroll={(event) => onScroll(event.currentTarget)}
      >
        <VirtualizedMessageList
          messages={renderedMessages}
          autoScrollEnabled={newestLocked}
          onPauseAutoScroll={pauseAutoScroll}
          onUserActivity={notePausedFeedActivity}
          twitchGlobalBadgeCatalog={twitchGlobalBadgeCatalog}
          twitchChannelBadgeCatalogByRoomId={twitchChannelBadgeCatalogByRoomId}
          onUsernameClick={(username) =>
            onIdentitySelect({
              username,
              displayName: username,
            })
          }
          onMessageClick={() => onInteraction()}
        />
      </div>
    );
  }

  return (
    <div
      ref={messageListRef}
      className="message-list"
      onWheel={(event) => event.stopPropagation()}
      onScroll={(event) => onScroll(event.currentTarget)}
    >
      {renderedMessages.map((message, index) => {
        const highlighted = highlightKeywords.some((word) =>
          message.message.toLowerCase().includes(word.toLowerCase()),
        );
        const ts = messageTimestamp(message);
        const prevTs =
          index > 0 ? messageTimestamp(renderedMessages[index - 1]) : 0;
        const showUnreadMarker =
          firstUnreadTimestamp > 0 &&
          ts >= firstUnreadTimestamp &&
          (index === 0 || prevTs < firstUnreadTimestamp);
        const source = sourceByPlatformChannel.get(
          `${message.platform}:${message.channel}`,
        );
        const sourceEmoteMap = source
          ? channelEmoteMapBySourceId[source.id]
          : undefined;
        const resolveEmote = (token: string) =>
          effectivePerformanceMode
            ? undefined
            : (sourceEmoteMap?.[token] ??
              (message.platform === "kick"
                ? kickGlobalEmoteMap[token]
                : globalEmoteMap[token]));
        const messageChunks = buildMessageChunks(message, resolveEmote);
        const combinedChannels = readCombinedChannels(message);
        const messageRaw = asRecord(message.raw);
        const isDeletedMessage = messageRaw?.deleted === true;
        const channelLabel =
          combinedChannels.length > 1
            ? `#${combinedChannels[0]} +${combinedChannels.length - 1}`
            : `#${message.channel}`;
        const channelTitle =
          combinedChannels.length > 1
            ? combinedChannels.map((channel) => `#${channel}`).join(", ")
            : `#${message.channel}`;
        const displayBadges = resolveDisplayedBadgesForMessage(
          message,
          twitchGlobalBadgeCatalog,
          twitchChannelBadgeCatalogByRoomId,
        );
        const displayName = message.displayName || message.username;

        return (
          <Fragment key={message.id}>
            {showUnreadMarker ? (
              <div className="chat-unread-marker" data-unread-marker="1">
                New messages
              </div>
            ) : null}
            <div
              data-platform={message.platform}
              className={
                highlighted
                  ? isDeletedMessage
                    ? "chat-line chat-line--legacy highlight deleted"
                    : "chat-line chat-line--legacy highlight"
                  : isDeletedMessage
                    ? "chat-line chat-line--legacy deleted"
                    : "chat-line chat-line--legacy"
              }
              data-jump-key={buildMessageJumpKey(message)}
              onClick={() => onInteraction()}
              onContextMenu={(event) => {
                event.preventDefault();
                onMessageContextMenu(event.nativeEvent, message);
              }}
            >
              <div className="chat-line__content">
                <div className="line-meta">
                  <span className={`platform ${message.platform}`}>
                    <PlatformIcon
                      platform={message.platform}
                      size="sm"
                      showBackground
                    />
                    <span>{message.platform}</span>
                  </span>
                  <span className="line-channel" title={channelTitle}>
                    {channelLabel}
                  </span>
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="line-author">
                  {displayBadges.length > 0 ? (
                    <span className="role-badges">
                      {displayBadges.map((badge) => {
                        if (badge.kind === "image") {
                          return (
                            <img
                              key={`${message.id}-${badge.key}`}
                              className="message-badge-image"
                              src={badge.asset.imageUrl}
                              alt=""
                              title={badge.asset.title}
                              loading="lazy"
                              decoding="async"
                            />
                          );
                        }
                        const uiRole = toUiRoleType(badge.badge.key);
                        if (uiRole) {
                          return (
                            <UiRoleBadge
                              key={`${message.id}-${badge.key}`}
                              role={uiRole}
                              size="sm"
                            />
                          );
                        }
                        return (
                          <span
                            key={`${message.id}-${badge.key}`}
                            className={`role-badge role-${badge.badge.key}`}
                            title={badge.badge.label}
                          >
                            {badge.badge.icon}
                          </span>
                        );
                      })}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="username-button"
                    style={{ color: message.color }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onIdentitySelect({
                        username: message.username,
                        displayName,
                      });
                    }}
                  >
                    {displayName}
                  </button>
                </div>
                <div
                  className={
                    isDeletedMessage ? "line-message deleted" : "line-message"
                  }
                >
                  {messageChunks.map((chunk, chunkIndex) =>
                    chunk.type === "text" ? (
                      <span key={`${message.id}-text-${chunkIndex}`}>
                        {renderTextWithLinks(
                          chunk.value,
                          `${message.id}-text-${chunkIndex}`,
                        )}
                      </span>
                    ) : (
                      <img
                        key={`${message.id}-emote-${chunkIndex}-${chunk.name}`}
                        className="inline-emote"
                        src={chunk.url}
                        alt={chunk.name}
                        title={chunk.name}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
