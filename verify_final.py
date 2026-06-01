"""Quick verification of remote's GTO Wizard state."""
import sys
sys.path.insert(0, 'packages/poker-core/src')

from gto_poker import *
print('✓ poker-core package imports')

# Verify PLO4  
from gto_poker.plo4 import PLO4Evaluator, PLO4Equity
from gto_poker.deck import Card
plo4 = PLO4Evaluator()
rank = plo4.evaluate('Ah', 'Kh', 'Qd', 'Js', 'Th', '9h', '3c', '7d', '2s')
print(f'✓ PLO4 evaluator works: rank={rank}')

# Verify Shortdeck
from gto_poker.shortdeck import ShortdeckHand, ShortdeckEquity
sd_hand = ShortdeckHand([Card('A','h'), Card('K','h'), Card('Q','h'), Card('J','h'), Card('T','h')])
print(f'✓ Shortdeck: {sd_hand.name} (type={sd_hand.hand_type})')

# Verify Double Board
from gto_poker.double_board import DoubleBoardEvaluator, ScoopTracker
tracker = ScoopTracker()
tracker.record(True, False)
tracker.record(False, True)
tracker.record(True, True)
ae = tracker.adjusted_equity()
print(f'✓ Double Board equity: {ae:.2f}')

# Verify Bomb Pot
from gto_poker.bomb_pot import BombPotGameModel, BombPotAction
model = BombPotGameModel()
sm = model.create_straddle_map(6, 2)
print(f'✓ Bomb Pot: straddle map has positions={len(sm)}')

# Verify Omaha Hi/Lo
from gto_poker.omaha_hi_lo import OmahaHiLoEvaluator, OmahaHiLoEquity
eval_omaha = OmahaHiLoEvaluator()
hole = [Card('A','h'), Card('2','d'), Card('3','c'), Card('K','s')]
board = [Card('4','h'), Card('5','d'), Card('6','c'), Card('7','s'), Card('8','d')]
result = eval_omaha.evaluate(hole, board)
print(f'✓ Omaha Hi/Lo: has_low={result.has_low}')

# Verify PLO5
from gto_poker.plo5 import PLO5Evaluator, PLO5Equity
plo5_eval = PLO5Evaluator()
rank5 = plo5_eval.evaluate('Ah', 'Kh', 'Qh', 'Jh', 'Tc', '9c', '8c', '7c', '6c', '5c')
print(f'✓ PLO5 evaluator: rank={rank5}')

print(f'\n✓✓✓ All variant modules verified!')
