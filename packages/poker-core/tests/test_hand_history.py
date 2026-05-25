"""Tests for hand history parsers (Winamax, PokerStars)."""

import pytest
from gto_poker.hand_history import (
    parse_winamax_hh,
    ParsedHand,
    PlayerInfo,
    Action,
    detect_format,
    _parse_card,
    _parse_hole_cards,
    _parse_currency_amount,
)


class TestCardParsing:
    """Test card string parsing."""
    
    def test_parse_standard_cards(self):
        assert _parse_card('As') == 'As'
        assert _parse_card('Kh') == 'Kh'
        assert _parse_card('Qd') == 'Qd'
        assert _parse_card('Jc') == 'Jc'
        assert _parse_card('Ts') == 'Ts'
        assert _parse_card('9h') == '9h'
        assert _parse_card('2d') == '2d'
    
    def test_parse_ten_card(self):
        # Winamax might use 10 or T
        assert _parse_card('Th') == 'Th'
        assert _parse_card('10d') == 'Td'  # 10 converted to T
    
    def test_parse_invalid_card(self):
        assert _parse_card('') == ''
        assert _parse_card('X') == ''
        assert _parse_card('invalid') == ''


class TestHoleCardsParsing:
    """Test hole cards string parsing."""
    
    def test_parse_standard_hole_cards(self):
        assert _parse_hole_cards('[As Kh]') == ['As', 'Kh']
        assert _parse_hole_cards('[Ad Ac]') == ['Ad', 'Ac']
    
    def test_parse_ten_in_hole_cards(self):
        assert _parse_hole_cards('[Ts Td]') == ['Ts', 'Td']


class TestCurrencyParsing:
    """Test currency amount parsing."""
    
    def test_parse_euros(self):
        assert _parse_currency_amount('150.00€') == 150.00
        assert _parse_currency_amount('45.50€') == 45.50
    
    def test_parse_dollars(self):
        assert _parse_currency_amount('$100.00') == 100.00
    
    def test_parse_european_format(self):
        # European format: 1.234,56 -> 1234.56
        assert _parse_currency_amount('1.234,56') == 1234.56


class TestWinamaxParser:
    """Test Winamax hand history parsing."""
    
    @pytest.fixture
    def sample_winamax_hh(self):
        """Sample Winamax hand history."""
        return """Winamax Hold'em - 2026-05-25 14:30:00

Table: 'Lyon' (real money) Seat #3 is the button
Seat 1: JohnDoe (150.00€)
Seat 2: PlayerTwo (100.00€)
Seat 3: ButtonPlayer (200.00€)
Seat 4: LuckyFour (125.00€)

*** PREFLOP ***
Dealt to JohnDoe [As Kh]
JohnDoe: raises to 3.00
PlayerTwo: folds
ButtonPlayer: calls 3.00
LuckyFour: folds

*** FLOP *** [7d 8c 9h]
PlayerTwo: checks
ButtonPlayer: bets 5.00
JohnDoe: calls 5.00
PlayerTwo: folds

*** TURN *** [7d 8c 9h] [2s]
ButtonPlayer: checks
JohnDoe: bets 10.00
ButtonPlayer: calls 10.00

*** RIVER *** [7d 8c 9h 2s] [3d]
ButtonPlayer: checks
JohnDoe: bets 20.00
ButtonPlayer: calls 20.00

*** SHOWDOWN ***
JohnDoe: shows [As Kh] (pair of Aces)
ButtonPlayer: shows [Ac Ad] (two pair, Aces and Sevens)
JohnDoe wins 45.00€

Pot: 45.00€ | Rake: 0.45€"""

    def test_parse_basic_structure(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        assert hand.site == 'winamax'
        assert hand.table_name == 'Lyon'
        assert hand.button_position == 3
        assert hand.hero_name == 'JohnDoe'
        assert len(hand.players) == 4
    
    def test_parse_players(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        player_names = [p.name for p in hand.players]
        assert 'JohnDoe' in player_names
        assert 'PlayerTwo' in player_names
        assert 'ButtonPlayer' in player_names
        assert 'LuckyFour' in player_names
        
        # Check stacks
        for p in hand.players:
            if p.name == 'JohnDoe':
                assert p.stack == 150.00
            if p.name == 'ButtonPlayer':
                assert p.stack == 200.00
    
    def test_parse_hole_cards(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        johndoe = next(p for p in hand.players if p.name == 'JohnDoe')
        assert johndoe.hole_cards == ['As', 'Kh']
        
        button = next(p for p in hand.players if p.name == 'ButtonPlayer')
        # ButtonPlayer's hole cards aren't revealed in this HH until showdown
    
    def test_parse_board(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        # Board should have flop, turn, river
        assert len(hand.board) == 5
        assert hand.board[0:3] == ['7d', '8c', '9h']  # Flop
        assert hand.board[3] == '2s'  # Turn
        assert hand.board[4] == '3d'  # River
    
    def test_parse_actions(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        # Check preflop actions
        preflop = hand.actions.get('preflop', [])
        assert len(preflop) == 4
        assert preflop[0].action == 'raise'
        assert preflop[0].player == 'JohnDoe'
        
        # Check flop actions
        flop = hand.actions.get('flop', [])
        assert len(flop) >= 2
        
        # Check turn actions
        turn = hand.actions.get('turn', [])
        assert len(turn) >= 2
        
        # Check river actions
        river = hand.actions.get('river', [])
        assert len(river) >= 2
    
    def test_parse_winners(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        assert len(hand.winners) == 1
        assert hand.winners[0] == ('JohnDoe', 45.00)
    
    def test_parse_pot(self, sample_winamax_hh):
        hand = parse_winamax_hh(sample_winamax_hh)
        
        assert hand.pot == 45.00
        assert hand.rake == 0.45


class TestWinamaxMinimalHand:
    """Test parsing a minimal Winamax hand (fold preflop)."""
    
    @pytest.fixture
    def minimal_hh(self):
        return """Winamax Hold'em - 2026-05-25

Table: 'Minimal' Seat #1 is the button
Seat 1: One (100.00€)
Seat 2: Two (100.00€)

*** HOLE CARDS ***
Dealt to One [As Ad]
One: folds
Two: checks

Pot: 2.00€ | Rake: 0.02€"""
    
    def test_parse_minimal_hand(self, minimal_hh):
        hand = parse_winamax_hh(minimal_hh)
        
        assert hand.site == 'winamax'
        assert hand.table_name == 'Minimal'
        assert len(hand.players) == 2
        assert hand.pot == 2.00


class TestDetectFormat:
    """Test hand history format detection."""
    
    def test_detect_winamax(self):
        text = "Winamax Hold'em - 2026-05-25"
        assert detect_format(text) == 'winamax'
    
    def test_detect_pokerstars(self):
        text = "PokerStars Hand #123456789: Hold'em No Limit"
        assert detect_format(text) == 'pokerstars'
    
    def test_detect_ggpoker(self):
        text = "GGPoker Hand #123456789: Hold'em No Limit"
        assert detect_format(text) == 'ggpoker'
    
    def test_detect_unknown(self):
        text = "Some unknown format"
        assert detect_format(text) is None


class TestParsedHandStructure:
    """Test ParsedHand dataclass structure."""
    
    def test_parsed_hand_defaults(self):
        hand = ParsedHand(hand_id='test123')
        
        assert hand.hand_id == 'test123'
        assert hand.site == 'winamax'
        assert hand.game_type == "No Limit Hold'em"
        assert hand.limit_type == 'No Limit'
        assert hand.stakes is None
        assert hand.table_name == ''
        assert hand.max_seats == 6
        assert hand.button_position == 0
        assert hand.players == []
        assert hand.actions == {}
        assert hand.board == []
        assert hand.pot == 0.0
        assert hand.rake == 0.0
        assert hand.winners == []
        assert hand.hero_name is None
        assert hand.raw_text == ''
    
    def test_parsed_hand_all_fields(self):
        hand = ParsedHand(
            hand_id='test456',
            site='winamax',
            game_type='Pot Limit Omaha',
            limit_type='Pot Limit',
            stakes=(0.5, 1.0),
            table_name='TestTable',
            max_seats=9,
            button_position=3,
            players=[PlayerInfo(name='TestPlayer', seat=1, stack=100.0)],
            pot=50.0,
            rake=0.50,
            winners=[('TestPlayer', 50.0)],
            hero_name='TestPlayer',
        )
        
        assert hand.hand_id == 'test456'
        assert hand.site == 'winamax'
        assert hand.game_type == 'Pot Limit Omaha'
        assert hand.limit_type == 'Pot Limit'
        assert hand.stakes == (0.5, 1.0)
        assert hand.table_name == 'TestTable'
        assert hand.max_seats == 9
        assert hand.button_position == 3
        assert len(hand.players) == 1
        assert hand.pot == 50.0
        assert hand.rake == 0.50
        assert hand.winners == [('TestPlayer', 50.0)]
        assert hand.hero_name == 'TestPlayer'


class TestActionStructure:
    """Test Action dataclass structure."""
    
    def test_action_defaults(self):
        action = Action(player='JohnDoe', action='fold')
        
        assert action.player == 'JohnDoe'
        assert action.action == 'fold'
        assert action.amount is None
        assert action.street == 'preflop'
    
    def test_action_with_amount(self):
        action = Action(player='JohnDoe', action='bet', amount=25.00, street='flop')
        
        assert action.player == 'JohnDoe'
        assert action.action == 'bet'
        assert action.amount == 25.00
        assert action.street == 'flop'
    
    def test_action_raise(self):
        action = Action(player='JohnDoe', action='raise', amount=40.00, street='preflop')
        
        assert action.action == 'raise'
        assert action.amount == 40.00
        assert action.street == 'preflop'


class TestPlayerInfoStructure:
    """Test PlayerInfo dataclass structure."""
    
    def test_player_info_defaults(self):
        player = PlayerInfo(name='JohnDoe', seat=1, stack=100.0)
        
        assert player.name == 'JohnDoe'
        assert player.seat == 1
        assert player.stack == 100.0
        assert player.hole_cards is None
        assert player.position is None
    
    def test_player_info_with_cards(self):
        player = PlayerInfo(
            name='JohnDoe',
            seat=1,
            stack=100.0,
            hole_cards=['As', 'Kh'],
            position='button'
        )
        
        assert player.hole_cards == ['As', 'Kh']
        assert player.position == 'button'