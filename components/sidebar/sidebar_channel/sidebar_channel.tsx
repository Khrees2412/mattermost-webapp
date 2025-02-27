// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {AnimationEvent, ReactNode} from 'react';
import {Draggable} from 'react-beautiful-dnd';
import classNames from 'classnames';

import {Channel} from '@mattermost/types/channels';

import FormattedMarkdownMessage from 'components/formatted_markdown_message';
import {DraggingState} from 'types/store';
import Constants from 'utils/constants';

import SidebarBaseChannel from './sidebar_base_channel';
import SidebarDirectChannel from './sidebar_direct_channel';
import SidebarGroupChannel from './sidebar_group_channel';

type Props = {

    /**
     * The channel object for this channel list item
     */
    channel: Channel;

    channelIndex: number;

    /**
     * If in a DM, the name of the user your DM is with
     */
    teammateUsername?: string;

    /**
     * The current team you are on
     */
    currentTeamName: string;

    /**
     * Number of unread mentions in this channel
     */
    unreadMentions: number;

    /**
     * Whether or not the channel is shown as unread
     */
    isUnread: boolean;

    /**
     * Gets the ref for a given channel id
     */
    getChannelRef: (channelId: string) => HTMLLIElement | undefined;

    /**
     * Sets the ref for the sidebar channel div element, so that it can be used by parent components
     */
    setChannelRef: (channelId: string, ref: HTMLLIElement) => void;

    /**
     * If category is collapsed
     */
    isCategoryCollapsed: boolean;

    /**
     * Is the channel the currently focused channel
     */
    isCurrentChannel: boolean;

    isAutoSortedCategory: boolean;

    isDraggable: boolean;

    draggingState: DraggingState;

    isCategoryDragged: boolean;

    isDropDisabled: boolean;

    isChannelSelected: boolean;

    multiSelectedChannelIds: string[];

    autoSortedCategoryIds: Set<string>;
};

type State = {
    show: boolean;
};

export default class SidebarChannel extends React.PureComponent<Props, State> {
    static defaultProps = {
        isDraggable: true,
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            show: true,
        };
    }

    isCollapsed = (props: Props) => {
        return props.isCategoryDragged || (props.isCategoryCollapsed && !this.props.isUnread && !props.isCurrentChannel);
    }

    getRef = () => {
        return this.props.getChannelRef(this.props.channel.id);
    }

    setRef = (refMethod?: (element: HTMLLIElement) => void) => {
        return (ref: HTMLLIElement) => {
            this.props.setChannelRef(this.props.channel.id, ref);
            refMethod?.(ref);
        };
    }

    handleAnimationStart = (event: AnimationEvent) => {
        if (event && event.animationName === 'toOpaqueAnimation' && !this.isCollapsed(this.props)) {
            this.setState({show: true});
        }
    }

    handleAnimationEnd = (event: AnimationEvent) => {
        if (event && event.animationName === 'toTransparentAnimation' && this.isCollapsed(this.props)) {
            this.setState({show: false});
        }
    }

    render() {
        const {
            channel,
            channelIndex,
            currentTeamName,
            isCurrentChannel,
            isDraggable,
            isAutoSortedCategory,
            isChannelSelected,
            isUnread,
            draggingState,
            multiSelectedChannelIds,
            autoSortedCategoryIds,
        } = this.props;

        let component: ReactNode;
        if (!this.state.show) {
            component = null;
        } else if (channel.type === Constants.DM_CHANNEL) {
            component = (
                <SidebarDirectChannel
                    channel={channel}
                    currentTeamName={currentTeamName}
                />
            );
        } else if (channel.type === Constants.GM_CHANNEL) {
            component = (
                <SidebarGroupChannel
                    channel={channel}
                    currentTeamName={currentTeamName}
                />
            );
        } else {
            component = (
                <SidebarBaseChannel
                    channel={channel}
                    currentTeamName={currentTeamName}
                />
            );
        }

        let wrappedComponent: React.ReactNode;

        if (isDraggable) {
            let selectedCount: React.ReactNode;
            if (isChannelSelected && draggingState.state && draggingState.id === channel.id && multiSelectedChannelIds.length > 1) {
                selectedCount = this.state.show ? (
                    <div className='SidebarChannel__selectedCount'>
                        <FormattedMarkdownMessage
                            id='sidebar_left.sidebar_channel.selectedCount'
                            defaultMessage='{count} selected'
                            values={{count: multiSelectedChannelIds.length}}
                        />
                    </div>
                ) : null;
            }

            wrappedComponent = (
                <Draggable
                    draggableId={channel.id}
                    index={channelIndex}
                >
                    {(provided, snapshot) => {
                        return (
                            <li
                                draggable='false'
                                ref={this.setRef(provided.innerRef)}
                                className={classNames('SidebarChannel', {
                                    collapsed: this.isCollapsed(this.props),
                                    expanded: !this.isCollapsed(this.props),
                                    unread: isUnread,
                                    active: isCurrentChannel,
                                    dragging: snapshot.isDragging,
                                    selectedDragging: isChannelSelected && draggingState.state && draggingState.id !== channel.id,
                                    fadeOnDrop: snapshot.isDropAnimating && snapshot.draggingOver && autoSortedCategoryIds.has(snapshot.draggingOver),
                                    noFloat: isAutoSortedCategory && !snapshot.isDragging,
                                })}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onAnimationStart={this.handleAnimationStart}
                                onAnimationEnd={this.handleAnimationEnd}
                                role='listitem'
                                tabIndex={-1}
                            >
                                {component}
                                {selectedCount}
                            </li>
                        );
                    }}
                </Draggable>
            );
        } else {
            wrappedComponent = (
                <li
                    ref={this.setRef()}
                    className={classNames('SidebarChannel', {
                        collapsed: this.isCollapsed(this.props),
                        expanded: !this.isCollapsed(this.props),
                        unread: isUnread,
                        active: isCurrentChannel,
                    })}
                    onAnimationStart={this.handleAnimationStart}
                    onAnimationEnd={this.handleAnimationEnd}
                    role='listitem'
                >
                    {component}
                </li>
            );
        }

        return wrappedComponent;
    }
}
