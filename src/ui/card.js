/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Logo from './logo';
import UIContext from './ui-context';
import { Draggable, DragComponent } from 'react-dragtastic';
import './card.css';

class CardImpl extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    isFaceUp: PropTypes.bool,
    front: PropTypes.node,
    back: PropTypes.node,
    className: PropTypes.string,
    dragZone: PropTypes.string,
    style: PropTypes.any,
    onClick: PropTypes.func,
    context: PropTypes.any.isRequired,
    position: PropTypes.any,
    inDeck: PropTypes.bool,
    data: PropTypes.any,
    deckPosition: PropTypes.number,
  };

  static defaultProps = {
    onClick: () => {},
    isFaceUp: false,
    dragZone: 'bgio-card',
    front: <div className="bgio-card__front">Card</div>,
    back: (
      <div className="bgio-card__back">
        <Logo width="48" />
      </div>
    ),
  };

  constructor(props) {
    super(props);
    this.domRef = React.createRef();
  }

  onClick = () => {
    const { id, data } = this.props;
    this.props.onClick({ id, data });
  };

  onDragEnd = () => {
    if (!this.props.context.sandboxMode) {
      return;
    }

    const t = this.domRef.current;

    if (t) {
      this.props.context.moveCard(this.props.id, {
        x: t.offsetLeft,
        y: t.offsetTop,
      });
    }

    if (this.isOverAccepted === false) {
      this.props.context.dropCard(this.props.id, null);
    }
  };

  render() {
    const classNames = ['bgio-card'];
    if (this.props.className) classNames.push(this.props.className);

    let cardStyle = {};

    if (this.props.context.sandboxMode) {
      const position = this.props.position;

      if (position) {
        cardStyle = {
          position: 'fixed',
          zIndex: position.zIndex || 5,
          left: position.x,
          top: position.y,
        };
      }
    }

    if (this.props.inDeck) {
      cardStyle = {
        position: 'absolute',
        zIndex: this.props.deckPosition,
      };
    }

    const draggable = (
      <Draggable
        id={this.props.id}
        type={this.props.dragZone}
        onDragEnd={this.onDragEnd}
        data={{ id: this.props.id, data: this.props.data }}
      >
        {({ isActive, events }) => {
          return (
            <div
              className={classNames.join(' ')}
              style={{
                ...this.props.style,
                ...cardStyle,
                opacity: isActive ? 0 : 1,
                pointerEvents: isActive ? 'none' : 'all',
              }}
              {...events}
            >
              {this.props.isFaceUp ? this.props.front : this.props.back}
            </div>
          );
        }}
      </Draggable>
    );

    const self = this;
    const dragComponent = (
      <DragComponent for={this.props.id}>
        {({ x, y, isOverAccepted, currentlyHoveredDroppableId }) => {
          const classes = [...classNames];
          let content = this.props.back;

          self.isOverAccepted = isOverAccepted;

          if (this.props.isFaceUp) {
            content = this.props.front;
          }

          if (currentlyHoveredDroppableId !== null) {
            if (isOverAccepted) {
              classes.push('accept');
            } else {
              classes.push('reject');
            }
          }

          return (
            <div
              className={classes.join(' ')}
              ref={this.domRef}
              style={{
                cursor: 'pointer',
                borderWidth: 2,
                pointerEvents: 'none',
                position: 'fixed',
                zIndex: 2000000000,
                boxShadow: '5px 5px 5px #eee',
                left: x - 50,
                top: y - 70,
              }}
            >
              {content}
            </div>
          );
        }}
      </DragComponent>
    );

    return (
      <div onClick={this.onClick}>
        {draggable}
        {dragComponent}
      </div>
    );
  }
}

const Card = props => (
  <UIContext.Consumer>
    {context => <CardImpl {...props} context={context} />}
  </UIContext.Consumer>
);

export { Card };
