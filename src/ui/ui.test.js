/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Card } from './card';
import { Deck } from './deck';
import { UI, GenID, MoveCard, DropCard } from './ui';

Enzyme.configure({ adapter: new Adapter() });

beforeEach(() => {
  jest.resetModules();
});

describe('basic', () => {
  let root;
  beforeEach(() => {
    root = Enzyme.mount(
      <UI>
        <div>
          <Deck id="1">
            <Card id="1" />
          </Deck>
        </div>

        <div />

        <Card id="2" />
      </UI>
    );
  });

  test('is rendered', () => {
    expect(root.find(Deck).length).toBe(1);
    expect(root.find(Card).length).toBe(2);
  });
});

describe('placeholder', () => {
  let root;
  beforeEach(() => {
    root = Enzyme.mount(
      <UI sandboxMode={true}>
        <Deck id="1" />
        <Card id="1" />
      </UI>
    );
  });

  test('is rendered when dropped', () => {
    root
      .instance()
      .getContext()
      .dropCard('1', '1');
    root.update();
    expect(root.find('.placeholder').length).toBe(1);
  });

  test('is rendered when dragged', () => {
    root.instance().cards = { '1': { position: true } };
    root.instance().forceUpdate();
    root.update();
    expect(root.find('.placeholder').length).toBe(1);
  });
});

describe('API', () => {
  const cardA = {
    id: 'cardA',
    position: { zIndex: 0 },
    props: {},
  };

  const state = {
    _nextID: 1,
    _zIndex: 5,

    props: {
      sandboxMode: true,
    },

    forceUpdate: jest.fn(),

    cards: {
      cardA: cardA,
    },

    decks: {
      deckA: { cards: [], props: { onRemove: () => {} } },
      deckB: { cards: [], props: {} },
    },
  };

  const move = MoveCard.bind(state);
  const drop = DropCard.bind(state);
  const genID = GenID.bind(state);

  beforeEach(() => {
    state.props.sandboxMode = true;
    state.forceUpdate = jest.fn();
  });

  test('not called when sandboxMode = false', () => {
    state.props.sandboxMode = false;
    move('cardA');
    drop('cardA', 'deckA');
    expect(state.forceUpdate).not.toBeCalled();
  });

  test('move card', () => {
    move('cardA');
    expect(state.cards['cardA'].position.zIndex).toBe(5);
  });

  test('drop card into deckA', () => {
    drop('cardA', 'deckA');
    expect(state.decks['deckA'].cards.length).toBe(1);
    expect(state.decks['deckB'].cards.length).toBe(0);
    expect(state.cards['cardA'].deckID).toBe('deckA');
  });

  test('drop card into deckB', () => {
    drop('cardA', 'deckB');
    expect(state.decks['deckA'].cards.length).toBe(0);
    expect(state.decks['deckB'].cards.length).toBe(1);
    expect(state.cards['cardA'].deckID).toBe('deckB');
  });

  test('drop card', () => {
    drop('cardA');
    expect(state.cards['cardA'].deckID).toBe(undefined);
  });

  test('genID', () => {
    expect(genID()).toBe(1);
    expect(state._nextID).toBe(2);
  });
});
