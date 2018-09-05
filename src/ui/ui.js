/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card } from './card';
import { Deck } from './deck';
import UIContext from './ui-context';

export function GenID() {
  return this._nextID++;
}

export function MoveCard(cardID, position) {
  if (!this.props.sandboxMode) {
    return;
  }

  this.cards[cardID].position = { ...position, zIndex: this._zIndex++ };
  this.forceUpdate();
}

export function DropCard(cardID, deckID) {
  if (!this.props.sandboxMode) {
    return;
  }

  const card = this.cards[cardID];

  // Remove card from any deck it was a part of.
  if (card.deckID) {
    const deck = this.decks[card.deckID];
    deck.cards = deck.cards.filter(item => item != cardID);

    if (deck.props.onRemove) {
      const { id, data } = card.props;
      deck.props.onRemove({ id, data });
    }
  }

  card.deckID = deckID;

  // Add card to new deck (if any).
  if (deckID) {
    const deck = this.decks[card.deckID];
    deck.cards.push(cardID);
  }

  this.forceUpdate();
}

/**
 * Root element of the UI framework.
 */
class UI extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    sandboxMode: PropTypes.bool,
  };

  static defaultProps = {
    sandboxMode: false,
  };

  constructor(props) {
    super(props);

    /**
     * Used for generating ID's of elements in the subtree.
     * @private
     */
    this._nextID = 1;

    /**
     * The zIndex of the most recently dragged card.
     * Incremented by 1 every time a new card is dragged.
     * @private
     */
    this._zIndex = 5;

    /**
     * Object containing all the Card's.
     * @private
     */
    this.cards = {};

    /**
     * Object containing all the Deck's.
     * @private
     */
    this.decks = {};

    /**
     * ID's of the Card's that were originally children of this UI element.
     * @private
     */
    this.originalCards = new Set();

    this.extractChildren(props.children);
  }

  /**
   * Recursively extracts all the Card and Deck elements
   * in the subtree of this node and adds them to appropriate
   * data structures.
   *
   * @param {object} children - A React props.children object.
   */
  extractChildren(children) {
    React.Children.forEach(children, child => {
      if (child.type == Card) {
        this.cards[child.props.id] = {
          props: child.props,
          position: null,
          deckID: null,
        };
        this.originalCards.add(child.props.id);
      } else if (child.type == Deck) {
        const deckID = child.props.id;
        let cardIDs = [];

        React.Children.forEach(child.props.children, card => {
          cardIDs.push(card.props.id);
          this.cards[card.props.id] = {
            props: card.props,
            position: null,
            deckID,
          };
        });

        this.decks[child.props.id] = {
          props: child.props,
          cards: cardIDs,
        };
      } else if (child.props && child.props.children) {
        this.extractChildren(child.props.children);
      }
    });
  }

  getContext = () => {
    return {
      sandboxMode: this.props.sandboxMode,
      genID: GenID.bind(this),
      moveCard: MoveCard.bind(this),
      dropCard: DropCard.bind(this),
    };
  };

  componentDidMount() {
    this._nextID = 0;
  }

  render() {
    let freeCards = [];
    let placeholders = [];
    for (const id in this.cards) {
      const card = this.cards[id];
      if (!card.deckID) {
        freeCards.push(
          <Card id={id} key={id} position={card.position} {...card.props} />
        );
      }

      if (this.originalCards.has(id) && (card.position || card.deckID)) {
        placeholders.push(<div className="bgio-card placeholder" key={id} />);
      }
    }

    let decks = [];
    for (const id in this.decks) {
      const deck = this.decks[id];

      let cards = [];
      for (let i = 0; i < deck.cards.length; i++) {
        const cardID = deck.cards[i];
        const card = this.cards[cardID];
        cards.push(<Card id={cardID} key={'deck:' + cardID} {...card.props} />);
      }

      decks.push(
        <Deck id={id} key={id} {...deck.props}>
          {cards}
        </Deck>
      );
    }

    return (
      <UIContext.Provider value={this.getContext()}>
        <div className="bgio-ui">
          {placeholders}
          {freeCards}
          {decks}
        </div>
      </UIContext.Provider>
    );
  }
}

export { UI };
