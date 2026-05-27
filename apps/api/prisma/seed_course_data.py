"""
Seed data for training courses - Real poker training content.

Run with: python -m apps.api.prisma.seed_course_data
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import uuid
from apps.api.services.database import get_session_context
from apps.api.models.course_models import Course, Lesson


# === COURSE 1: NLH BEGINNER FOUNDATIONS ===

BEGINNER_COURSE = {
    "title": "NLH Fundamentals: Build Your Foundation",
    "description": "Master the essential concepts of No-Limit Hold'em from scratch. Learn proper preflop ranges, basic postflop strategy, and develop a solid foundation for continuous improvement.",
    "short_description": "Essential NLH fundamentals for new players",
    "game_type": "nlh",
    "difficulty": "beginner",
    "category": "preflop",
    "duration_minutes": 180,
    "is_published": True,
    "is_featured": True,
    "prerequisites": [],
    "tags": ["beginner", "fundamentals", "preflop", "postflop", "basics"],
    "author": "GTO Wizard Team",
    "lessons": [
        {
            "title": "Welcome to Poker Fundamentals",
            "content": """# Welcome to Poker Fundamentals

Congratulations on starting your poker journey! This course will teach you the essential concepts that every successful poker player needs.

## What You'll Learn

- **Position** - Why position is the most important factor in poker
- **Hand Strength** - How to evaluate your hand relative to the board
- **Betting for Value** - When to bet to get called by worse hands
- **Bluffing Basics** - How to make your bluffs work
- **Bankroll Management** - Protecting your poker stake

## How to Use This Course

Each lesson includes video content, interactive quizzes, and practice spots. Complete each lesson before moving to the next.

Take notes as you go - the best students actively engage with the material.

Let's get started!
""",
            "content_type": "text",
            "order_index": 0,
            "duration_minutes": 10,
            "is_preview": True,
        },
        {
            "title": "Understanding Position",
            "content": """# Understanding Position

Position is the single most important concept in poker. Being in position means you act last on every street, giving you a massive informational advantage.

## Position Types (from earliest to latest)

1. **UTG (Under the Gun)** - First to act preflop, worst position
2. **MP (Middle Position)** - Acts after UTG
3. **CO (Cutoff)** - Second to last preflop
4. **BTN (Button)** - Last to act, best position
5. **SB (Small Blind)** - Early position postflop
6. **BB (Big Blind)** - Defends the blind

## Why Position Matters

When you're in position:
- You see what opponents do before you act
- You can steal blinds more easily
- You control the pot size more effectively
- Your bluffs work more often

## Key Takeaway

Always play more hands in position and fewer hands out of position. This single adjustment will dramatically improve your win rate.
""",
            "content_type": "text",
            "order_index": 1,
            "duration_minutes": 15,
            "is_preview": True,
        },
        {
            "title": "Starting Hand Strength",
            "content": """# Starting Hand Strength

Not all hands are created equal. Learn which hands to play and which to fold.

## Hand Categories

### Premium Hands (Play almost always)
- **AA, KK** - The absolute best
- **QQ, JJ** - Strong pairs
- **AKs, AKo** - Strong Ace-high combinations

### Good Hands (Play profitably in position)
- **TT, 99, 88** - Medium pairs
- **AQs, AJs, KQs** - Strong suited connectors
- **JTs, T9s** - Suited connectors

### Marginal Hands (Play selectively)
- **AJo, KJo** - Offsuit broadway
- **77, 66** - Small pairs
- **QJs, J9s** - Weaker suited connectors

### Trash Hands (Fold most of the time)
- **72o, 83o, 94o** - Low cards
- **K2o, Q3o** - Weak offsuit cards

## Key Insight

Hand strength is relative to:
- Your position
- The action ahead of you
- The board texture
- Your opponent's tendencies
""",
            "content_type": "text",
            "order_index": 2,
            "duration_minutes": 20,
            "is_preview": True,
        },
        {
            "title": "Basic Preflop Strategy",
            "content": """# Basic Preflop Strategy

Your preflop decisions set the stage for the entire hand. Making good decisions here makes postflop much easier.

## Opening Ranges

### From Button (BTN)
Open about 40% of hands:
- All pairs: 22-AA
- All suited: A2s-KTs, QJs, JTs, T9s, 98s, 87s, 76s, 65s, 54s
- Offsuit: ATo-AJo, KTo, QTo, JTo

### From Cutoff (CO)
Open about 30% of hands:
- Remove some weaker offsuit hands

### From Early Position (UTG/MP)
Open about 15% of hands:
- Only premium hands and strong suited connectors

## Sizing

Standard open size: **3-4 big blinds**

Smaller in late position (3bb), larger in early position (4bb) to compensate for worse position.

## Key Rules

1. Open more hands in late position
2. Raise to isolate limpers
3. Be tighter in early position
4. Adjust based on stack depth
""",
            "content_type": "text",
            "order_index": 3,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Continuation Betting Basics",
            "content": """# Continuation Betting Basics

The continuation bet (c-bet) is when you bet on the flop after being the preflop aggressor. This is one of the most fundamental concepts in poker.

## When to C-Bet

C-bet frequently on dry, coordinated boards:
- **High cards hit** (Ace-high, King-high)
- **Paired boards**
- **No flush draws possible**

C-bet selectively on wet, scary boards:
- **3 flush cards on board**
- **Straight possibilities**

## Sizing

Standard c-bet size: **1/3 to 2/3 pot**

Small bets work well on dry boards. Use larger sizes on wet boards to deny equity.

## Balance

You must c-bet with some bluffs to stay balanced:
- On dry boards: Bet small with value AND bluffs
- On wet boards: Check more, especially with medium strength

## Key Concept

Your range as the preflop aggressor has more strong hands than your opponent's range. Use this to your advantage.
""",
            "content_type": "text",
            "order_index": 4,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Value Betting Fundamentals",
            "content": """# Value Betting Fundamentals

Value betting is when you bet with a hand that you think is ahead of your opponent's range. The goal is to get called by worse hands.

## When to Value Bet

1. **You have a strong made hand** (top pair+, two pair, sets, straights, flushes)
2. **The board is favorable** - cards that favor your range
3. **Your opponent has weak hands** - they'll call with worse

## Sizing Principles

- **Thin value**: When you're barely ahead, bet smaller (1/3-1/2 pot)
- **Thick value**: When you're way ahead, bet larger (2/3-pot/full pot)

## Reading the Board

Ask yourself:
- "What does my opponent think I have?"
- "What hands can my opponent have that call me?"
- "Am I ahead of those hands?"

If yes to both, you have a value betting situation.
""",
            "content_type": "text",
            "order_index": 5,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Basic Bluffing",
            "content": """# Basic Bluffing

A bluff is a bet with a hand that is behind but can win if your opponent folds. Well-timed bluffs are essential to winning poker.

## When to Bluff

1. **Your opponent has weak/capped range**
2. **The board texture favors your perceived range**
3. **You have fold equity** (chance your opponent folds)
4. **You have backdoor outs** (backup way to win)

## Sizing

- **Polarized bluffs**: Use large sizing (2/3+ pot) when you're either bluffing or have absolute nuts
- **Merged bluffs**: Use medium sizing with medium-strength hands

## The "Free Roll" Bluff

Sometimes you can bluff while possibly having the best hand - that's a free roll situation. These are ideal spots.

## Common Mistake: Over-Bluffing

New players bluff too often. For every bluff, ask:
- "Does my opponent fold often enough?"
- "What are my backdoor outs if called?"
""",
            "content_type": "text",
            "order_index": 6,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Bankroll Management",
            "content": """# Bankroll Management

Bankroll management is how you protect your poker money from going broke. Even the best players have downswings - proper bankroll management ensures you survive them.

## The Golden Rule

**Never risk more than 2% of your bankroll on a single session**

## Buy-in Guidelines by Stake

| Stake | Minimum Bankroll |
|-------|------------------|
| $1/$2 | $2,000 |
| $2/$5 | $5,000 |
| $5/$10 | $10,000 |
| $10/$25 | $25,000 |

## Moving Up

Only move up when you have 30-40 buy-ins for the higher stake. Move down if you drop below 20 buy-ins.

## Variance

Even the best players can lose 10-12 buy-ins in a downswing:
- This is normal variance
- Don't go on tilt
- Trust your process

## Key Principle

Think of your bankroll as a business investment. Just as you wouldn't gamble your business capital, don't gamble your poker bankroll.
""",
            "content_type": "text",
            "order_index": 7,
            "duration_minutes": 20,
            "is_preview": True,
        },
    ],
}


# === COURSE 2: POSTFLOP MASTERY ===

POSTFLOP_COURSE = {
    "title": "Postflop Mastery: Dominate the Flop, Turn, and River",
    "description": "Take your poker game to the next level with advanced postflop strategy. Learn to navigate complex board textures, use range analysis, and make mathematically sound decisions on every street.",
    "short_description": "Advanced postflop strategy for dominating every street",
    "game_type": "nlh",
    "difficulty": "advanced",
    "category": "postflop",
    "duration_minutes": 240,
    "is_published": True,
    "is_featured": True,
    "prerequisites": [],
    "tags": ["advanced", "postflop", "flop", "turn", "river", "strategy", "gto"],
    "author": "GTO Wizard Team",
    "lessons": [
        {
            "title": "Range Analysis Fundamentals",
            "content": """# Range Analysis Fundamentals

Understanding ranges is the foundation of advanced poker strategy. A "range" is the set of hands your opponent could have based on their actions.

## Types of Ranges

### Polarized Ranges
- Contains very strong hands (value) and very weak hands (bluffs)
- Example: Someone who 3-bets preflop and bets big on the flop
- They have AA/KK but also sometimes A5s or 72o

### Condensed Ranges  
- Contains mostly medium-strength hands
- Example: Someone who calls preflop and checks the flop
- Their range is capped - they usually don't have premium hands

### Linear Ranges
- Contains strong hands at the top, tapering down
- Example: Button open-raising range
- Contains AA at the top, but also includes some weaker hands

## Reading Board Texture

Ask these questions about any board:
1. What does this board hit?
2. What does it miss?
3. How does it interact with my hand and my opponent's likely range?

## The Equity Concept

Your hand's equity is its chance of winning against your opponent's range:
- **AA on K72r**: ~90% equity (board misses almost everything)
- **AK on K72r**: ~70% equity (one pair, vulnerable)

Understanding equity helps you make optimal decisions.
""",
            "content_type": "text",
            "order_index": 0,
            "duration_minutes": 30,
            "is_preview": True,
        },
        {
            "title": "Wet vs Dry Boards",
            "content": """# Wet vs Dry Boards

Board texture is one of the most important postflop concepts. Wet boards are coordinated with many draws; dry boards lack these dangers.

## Dry Boards (Good for continuing range)

Characteristics:
- High cards with gaps (Q-J-2)
- Paired boards (KK4, 887)
- Rainbow boards (no flush draws)

Strategy:
- C-bet frequently with your entire range
- Use smaller bet sizes
- Don't be afraid to bet with medium pairs

## Wet Boards (Scary, coordinated)

Characteristics:
- 3 cards to a flush
- Connected cards (T98, 876)
- Monotone boards (all same suit)

Strategy:
- Check more with medium strength
- Use larger bet sizes for protection
- Range check some hands that can't continue

## Example: AKQ Board

This board is WET because:
- Flush possible (hearts not on board yet)
- Straight possible (JJ, TT, QQ, Kk combinations)
- Many overcards hurt weaker pairs

## Key Principle

On wet boards, the player in position has a massive advantage because they can realize equity cheaply by checking.
""",
            "content_type": "text",
            "order_index": 1,
            "duration_minutes": 25,
            "is_preview": True,
        },
        {
            "title": "Turn and River Strategy",
            "content": """# Turn and River Strategy

Later streets require more precise reasoning. The pot is larger and mistakes cost more.

## Turn Strategy

The turn is the critical street because:
- The river is one card away
- Drawing hands complete or miss
- You can no longer re-draw to improve

### When to Barrel

Good times to bet the turn:
- You c-bet the flop and your opponent called
- The turn is a "blank" (doesn't change much)
- You've shown strength and want to take the pot

### Checking Back

Good times to check the change:
- You have showdown value (just want to see river)
- The board is very wet and scary
- You want to control the pot size

## River Strategy

The river is showdown - no more cards come. Key principles:

### Value Betting
- When you've improved to a strong hand
- Opponent's range is weak/capped
- Size for thin value with marginal hands

### Bluffing
- You have no showdown value
- Your story makes sense
- Opponent has weak hands that can fold
- Use smaller bluff sizes

### Key Concept: The "Gap"

Between what your opponent calls and what they fold = your value bluffic gap. If your bluff is over this gap, it's profitable.
""",
            "content_type": "text",
            "order_index": 2,
            "duration_minutes": 30,
            "is_preview": False,
        },
        {
            "title": "Exploitation vs GTO",
            "content": """# Exploitation vs GTO

Two approaches to poker strategy: Game Theory Optimal (GTO) and Exploitation.

## GTO (Game Theory Optimal)

GTO aims to play in a way that cannot be exploited regardless of what your opponent does.

Key concepts:
- Balanced ranges
- Optimal bet sizing
- Mixed strategies for some decisions
- Makes you unexploitable

**Best when**: Your opponent is strong and playing logically

## Exploitation

Exploitation means adjusting your strategy to take advantage of specific weaknesses in your opponent's game.

Examples:
- If opponent folds too much → bluff more
- If opponent calls too much → value bet more
- If opponent never 3-bets → open more hands

**Best when**: Your opponent is weak or has clear leaks

## Mixing Approaches

The best players combine both:

1. Start with GTO baseline (unexploitable default)
2. Look for opponent tendencies
3. Adjust exploitatively when you have reads
4. Be careful not to over-adjust

## Key Warning

Exploitative adjustments can be exploited back. Know when your read is strong enough to deviate from GTO.
""",
            "content_type": "text",
            "order_index": 3,
            "duration_minutes": 30,
            "is_preview": False,
        },
        {
            "title": "Overcards and Scary Boards",
            "content": """# Overcards and Scary Boards

Some of the most difficult spots involve overcards - when an Ace or King hits the board.

## When You Have Overcards

### Scenario 1: You have KK, Ace on board

This is common but tricky. Questions to ask:
- What does opponent's range look like?
- Did they lead out or check to you?
- What's your position?

Generally: Play conservatively. Many opponents have Ax hands that dominate you.

### Scenario 2: You have QQ, King on board

Similar to KK/Ace but slightly different:
- You have showdown value
- If facing a bet, often just call
- Raising often called by better hands

## Boards That Coordinate With Ranges

The most important concept: Would the board help my opponent's range?

### Example: KQ-hit Board

If villain opened from early position and K-Q hits:
- Their range hits this board hard
- They have many Kx, Qx, KQ combos
- Your medium pair is often behind

### Example: 7-5-2 Rainbow Board

If villain opened Button and 7-5-2 rainbow comes:
- This board mostly MISSES most ranges
- Your overcards are actually behind their range!
- They bet because they have the range advantage

## Key Takeaway

Your hand's strength is only meaningful relative to:
1. The board texture
2. Your opponent's likely range
3. Action so far
""",
            "content_type": "text",
            "order_index": 4,
            "duration_minutes": 30,
            "is_preview": False,
        },
        {
            "title": "Multiway Pot Strategy",
            "content": """# Multiway Pot Strategy

Playing well in multiway pots (3+ players) requires different reasoning than heads-up pots.

## Key Differences

### Heads-Up
- Your equity is straightforward
- Balance and deception matter
- Can control pot size easily

### Multiway
- Your equity is diluted
- Value is more important than bluffing
- Harder to bluff (multiple players to fold)

## Strategy Adjustments

### In Position
- Value bet thinner (everyone has weaker ranges)
- Check more often with medium hands
- Don't over-bluff

### Out of Position
- Check more to realize equity
- Smaller bet sizes
- Be careful with draws

## Common Mistake: Over-Bluffing Multiway

New players try to bluff too often in multiway pots. Instead:
- When you have a hand, bet for value
- When you bluff, have a strong story
- Multiway pots favor the player with the best hand

## Set Mining

One of the most profitable plays in multiway pots - calling with small pairs hoping to hit a set. The diluted equity means you need better odds, but when you hit, you often get paid off.
""",
            "content_type": "text",
            "order_index": 5,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Pot Commitment Decisions",
            "content": """# Pot Commitment Decisions

At some point in a hand, you'll face a decision that commits your stack. Knowing when to commit is crucial.

## The Commitment Threshold

Typically when about 60-70% of your stack is in the pot, you're "committed" and should be all-in or folding.

## Factors in Commitment

1. **Pot Odds**: What does your opponent need to call?
2. **Implied Odds**: How much can you win if you hit?
3. **Equity**: What's your chance of winning?
4. **Reverse Implied Odds**: What can you lose if you're behind?

## Reverse Implied Odds

The most dangerous concept in commitment decisions:

Example: You have 88 on Q-T-2 rainbow. Villain bets big.
- You have a gutshot straight draw (4 outs)
- But any Ace, King, or Jack gives villain a better hand
- If you hit your 8, villain might have AQ, KQ, AJ...

This is "reverse implied odds" - your draw can cost you money even when you hit.

## When to Fold

Generally fold if:
- You have poor reverse implied odds
- Your opponent's range is capped but strong
- You have weak draws with no backdoors

## When to Commit

Generally good:
- You have the absolute nuts
- You have good implied odds
- Opponent is capped and weak
""",
            "content_type": "text",
            "order_index": 6,
            "duration_minutes": 30,
            "is_preview": False,
        },
        {
            "title": "Putting It All Together",
            "content": """# Putting It All Together

Mastering postflop play is a journey. Let's review the key concepts and how to practice.

## Core Concepts Review

1. **Range Analysis**: Think about what hands your opponent can have
2. **Board Texture**: Match your strategy to the board
3. **Pot Odds & Equity**: Make mathematically sound decisions
4. **Exploitation vs GTO**: Know when to use each approach
5. **Multiway Considerations**: Adjust for multiple opponents

## Practice Methods

### Review Your Hands
- Use a hand history tool
- Analyze big pots
- Identify patterns in your mistakes

### Study GTO Solutions
- Use solver software to understand optimal play
- See how GTO handles different spots
- Compare your decisions to solutions

### Get Coaching
- A good coach can spot your leaks quickly
- Focus on fundamental errors first

## Common Beginner Mistakes

1. Bluffing too much on scary boards
2. Not value betting thin enough
3. Overvaluing medium pairs
4. Ignoring position
5. Not tracking results

## Next Steps

- Complete practice quizzes in the app
- Review hands after sessions
- Focus on one concept at a time
- Be patient - mastery takes years

Good luck at the tables!
""",
            "content_type": "text",
            "order_index": 7,
            "duration_minutes": 20,
            "is_preview": True,
        },
    ],
}


# === COURSE 3: ICM AND TOURNAMENT STRATEGY ===

ICM_COURSE = {
    "title": "Tournament Mastery: ICM, Bubble Play, and Final Table Strategy",
    "description": "Dominate tournament poker with advanced Independent Chip Modeling (ICM) concepts. Learn bubble strategy, final table play, and how to adjust your strategy based on tournament stage.",
    "short_description": "Tournament-specific strategy including ICM and bubble play",
    "game_type": "nlh",
    "difficulty": "advanced",
    "category": "tournament",
    "duration_minutes": 200,
    "is_published": True,
    "is_featured": False,
    "prerequisites": ["Intermediate poker knowledge"],
    "tags": ["tournament", "ICM", "bubble", "final table", "strategy"],
    "author": "GTO Wizard Team",
    "lessons": [
        {
            "title": "Introduction to ICM",
            "content": """# Introduction to ICM

ICM (Independent Chip Model) is the most important concept in tournament poker. Unlike cash games where chips = money, in tournaments the value of chips changes based on your position relative to the prize pool.

## Why ICM Matters

In a $10 tournament with 100 players:
- 1st place gets $500 (1 chip = $5)
- 50th place gets $10 (1 chip = $0.10)
- The same 100 chips have wildly different value!

## The ICM Concept

ICM calculates your equity in the tournament based on:
- Your current chip stack
- Prize pool distribution
- Number of players remaining
- Tournament stage

## Basic Example

You have 1,000 chips in a tournament where:
- 1st place: 50% of prize pool
- 2nd place: 30%
- 3rd place: 20%

If 10 players remain and you have 1,000 chips (10% of chips), your ICM equity is roughly 10% of the remaining prize pool.

But if you're the short stack (500 chips, 5%), you're worth less than 5% because you'll likely finish lower.

## Key Insight

In tournament play, chips are NOT equal to their face value. The smaller your stack relative to the field, the less each chip is worth.
""",
            "content_type": "text",
            "order_index": 0,
            "duration_minutes": 25,
            "is_preview": True,
        },
        {
            "title": "Bubble Play Strategy",
            "content": """# Bubble Play Strategy

The bubble is when players are close to the money but haven't reached it yet. This is the most complex tournament stage due to ICM pressure.

## Bubble Dynamics

### Big Stacks
- Can apply enormous pressure
- Target mid-stack players (MSPs)
- Steal blinds aggressively
- Look to eliminate short stacks

### Mid-Stack Players (20-40 big blinds)
- Most vulnerable position
- Need to be selective
- Looking to get to the money
- Avoid playing hands against big stacks

### Short Stacks (under 15 big blinds)
- Just want to survive
- Will call with any reasonable hand
- Blinds are a significant portion of stack
- Often push/fold territory

## Calling Ranges on Bubble

When a short stack pushes all-in, your call needs wider than usual because:
- You're risking more chips to win the same bounty
- ICM values saving chips

However, you should also consider:
- If called, do you have good equity?
- Your stack size if you call and lose
- The specific prize structure

## The "Push-Fold" Zone

When effective stack is under 15 big blinds, optimal strategy is often to either:
- Push all-in (if you have enough equity)
- Fold (if facing a raise)

Deviations from push-fold are usually mistakes due to ICM dynamics.
""",
            "content_type": "text",
            "order_index": 1,
            "duration_minutes": 30,
            "is_preview": True,
        },
        {
            "title": "Final Table Strategy",
            "content": """# Final Table Strategy

Reaching a final table is a major achievement. Adjust your strategy to maximize value.

## Prize Pool Jump

ICM is most extreme at final tables because:
- Jump from 9th to 8th place often huge
- Players become much more risk-averse
- Big stacks can bully effectively

## Dynamic ICM

At the final table, ICM becomes more "dynamic":
- Heads-up play becomes more common
- Short stack strategy is simpler
- Skill differences matter more

## Strategy Adjustments

### With a Big Stack
- Play aggressively for the win
- Apply pressure on mid-stacks
- Go for 1st place value

### With a Medium Stack
- Play to ladder up
- Pick spots against short stacks
- Look for +EV spots despite ICM

### Short Stack
- Survival mode
- Wait for spots to double up
- Avoid unnecessary confrontations
- If heads-up for 1st, anything can happen

## Heads-Up Play

When heads-up for 1st place:
- ICM pressure is gone
- Play for the win!
- Stack sizes matter more
- Play like a cash game
""",
            "content_type": "text",
            "order_index": 2,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "ICM and Preflop Ranges",
            "content": """# ICM and Preflop Ranges

ICM dramatically affects optimal preflop strategy, especially in late tournament stages.

## Tight vs Loose Ranges by Stack Size

### Under 10 Big Blinds
- Generally push/fold
- Push wider in late position
- Call tighter when short

### 15-30 Big Blinds
- More complex decisions
- 3-bet or fold ranges
- Consider min-raise/fold

### 30-50 Big Blinds
- Standard open-raising ranges
- Adjust for players with more/less
- Position matters more

### 50+ Big Blinds
- Play like a deep-stacked cash game
- More complex postflop scenarios
- Less ICM pressure

## Spot-Specific ICM

Sometimes it's correct to make -chip EV plays because of ICM:

### Example: Bubble Calling
Short stack pushes 5bb, you have 30bb with a premium hand.
- Chip EV: Calling might be slightly negative
- ICM EV: If you call and lose, you lose 20% of equity
- You should still call because equity difference is huge

### Example: Bubble Folding
Bubble player - a player with medium stack in the micro prizes.
- Often correct to fold good hands
- "Bubble-fold" is a real concept
- Don't waste your stack on marginal spots

## The "Bubble Factor"

Bubble Factor measures how much worse losing a pot is compared to winning it:
- Bubble factor > 1 means losing hurts more than winning helps
- At bubble, bubble factor can be 2-3x
- GTO calculations incorporate bubble factor
""",
            "content_type": "text",
            "order_index": 3,
            "duration_minutes": 30,
            "is_preview": False,
        },
        {
            "title": "Short Stack Strategy",
            "content": """# Short Stack Strategy

Playing short requires a disciplined, mathematical approach. Here's how to survive and thrive.

## When You're Short (Under 20 BB)

### Basic Rules
1. Preserve your stack - avoid marginal spots
2. Play hands with showdown value
3. Push/fold is usually optimal
4. Don't spiral - stay focused

### Push-Fold Decisions

Use push/fold charts when under 15bb:
- Late position: Push wider
- Early position: Push tighter
- Consider opponent types

### Calling Off-Bubble

When short and facing a raise:
- Need 40%+ equity typically
- Consider remaining stack after call
- Position matters
- Opponent range is crucial

## Short Stack Spots

### Against Another Short Stack
- Getting it in is often correct
- Generally race situations
- Skill因素 minimal

### Against Medium Stack
- Be more selective
- Medium stack often has fold equity
- Consider if you can outplay them postflop

### Against Big Stack
- Watch for squeeze plays
- Big stack may push you around
- Look for spots to double through

## Survival Mentality

Being short-stacked isn't failure - it's an opportunity. Many major tournament winners have come from short stacks. Stay calm, wait for spots, and strike when the time is right.
""",
            "content_type": "text",
            "order_index": 4,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Stealing and Consolidation",
            "content": """# Stealing and Consolidation

In tournament poker, accumulating chips through stealing and consolidation plays is crucial for survival and success.

## Blind Stealing

### When to Steal
- You're in late position
- Blinds are large relative to stacks
- Opponents in the blinds are weak
- Previous hands show weakness

### How to Steal
- Open-raise 2.5-3bb in late position
- If called, continuation bet often works
- Don't oversteal - be selective

### Blind Defense

As a blind facing a steal:
- 3-bet with premium hands
- Call with hands that play well postflop
- Change it up to remain unpredictable

## ICM Steals

### The Biggest ICM Spot: Bubble

When the bubble is near:
- Big stacks can "ICM steal" from medium stacks
- Medium stacks must fold marginal hands
- This creates +EV spots for big stacks

### The "ICM Tax"

Players pay an "ICM tax" when they:
- Call with mediocre hands against big stacks
- Play too many hands on the bubble
- Don't adjust their ranges properly

## Consolidation Spots

When you're a medium stack looking to ladder up:
- Play tight against big stacks
- Look for spots vs other medium stacks
- Be selective about which spots to play
- Prioritize survival over accumulation
""",
            "content_type": "text",
            "order_index": 5,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "SNG and Spin & Go Strategy",
            "content": """# SNG and Spin & Go Strategy

Sit-and-Go (SNG) and Spin & Go tournaments have unique ICM dynamics compared to multi-table tournaments.

## SNG Structure

Typical 9-max SNG payout:
- 1st: 50%
- 2nd: 30%
- 3rd: 20%

The top-heavy payout structure means 1st place is worth almost 3x more than 3rd. This affects strategy dramatically.

## Early Stage SNG

Play like a regular MTT early stage:
- Accumulate chips
- Avoid unnecessary confrontations
- Position still matters

## Middle Stage (4-6 players)

This is where ICM gets intense:
- Players get risk-averse
- Short stacks have huge fold equity
- Medium stacks must be careful

## Final Table (3 players)

Heads-Up mode begins:
- Higher variance
- Smaller stacks relative to blinds
- Play more hands
- Steal blinds aggressively

## Spin & Go Strategy

Spin & Gos are 3-max hyper-turbo SNGs:
- 3x buy-in top prize common (but can be 10,000x!)
- Blinds increase very fast
- Very push/fold oriented
- Pure ICM from the start

### Spin & Go Optimal Strategy

- Start push/fold very early
- Don't get fancy
- Stack-to-blind ratio is everything
- The rake almost always matters
""",
            "content_type": "text",
            "order_index": 6,
            "duration_minutes": 25,
            "is_preview": False,
        },
        {
            "title": "Course Conclusion",
            "content": """# Course Conclusion

Congratulations on completing Tournament Mastery! Let's recap the key concepts and next steps.

## Core Concepts Covered

1. **ICM Fundamentals**: Understanding chip value in tournaments
2. **Bubble Play**: Adjusting strategy when close to money
3. **Final Table**: Maximizing value when it matters most
4. **ICM & Preflop**: How ICM affects opening/3-betting ranges
5. **Short Stack Play**: Surviving and thriving when short
6. **Stealing/Consolidation**: Building stack strategically
7. **SNG/Spin & Go**: Specialized tournament formats

## Key Takeaways

### Tournament vs Cash Games
- Chips ≠ money (ICM)
- Survival is often more important than accumulation
- Position matters MORE in tournaments
- Risk management is crucial

### Most Common Mistakes
1. Calling too wide on bubble
2. Not adjusting to stack sizes
3. Overplaying medium pairs
4. Ignoring ICM in late stages
5. Not taking seriously the jump between places

## Practice Recommendations

1. Use an ICM calculator to understand spots
2. Review hands with the bubble factor in mind
3. Track your tournament ROI, not just chip winnings
4. Study GTO solutions for common bubble spots
5. Consider using a solver for deep analysis

## Where to Go Next

- Advanced ICM situations
- Specific game theory concepts
- Mental game and tilt management
- Session review and improvement

Good luck in your next tournament!
""",
            "content_type": "text",
            "order_index": 7,
            "duration_minutes": 15,
            "is_preview": True,
        },
    ],
}


COURSES = [
    BEGINNER_COURSE,
    POSTFLOP_COURSE,
    ICM_COURSE,
]


async def seed_courses():
    """Seed all courses with their lessons."""
    async with get_session_context() as session:
        for course_data in COURSES:
            lessons_data = course_data.pop("lessons", [])
            
            # Create course
            course = Course(**course_data)
            session.add(course)
            await session.flush()
            
            # Create lessons for this course
            for lesson_data in lessons_data:
                lesson = Lesson(course_id=course.id, **lesson_data)
                session.add(lesson)
            
            print(f"Created course: {course.title} with {len(lessons_data)} lessons")
        
        print(f"\nSuccessfully seeded {len(COURSES)} courses!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_courses())
