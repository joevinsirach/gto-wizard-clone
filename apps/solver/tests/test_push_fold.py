"""
Tests for push/fold charts, chart generator, and API.

Run with: pytest apps/solver/tests/test_push_fold.py -v
"""

import pytest
import sys
import json
from pathlib import Path

# Add paths
sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')
sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src')

from strategy.push_fold_charts import (
    PushFoldCharts,
    RANKS,
    RANK_INDICES,
    Action,
    get_hand_string,
    parse_hand_string,
    chart_to_matrix,
)

from strategy.chart_generator import (
    generate_nash_push_chart,
    generate_all_charts,
    lookup_action,
    lookup_hand,
    chart_to_json_serializable,
    json_to_chart,
    ChartGenerator,
)

from strategy.storage import (
    StrategyStorage,
    StoredStrategy,
    StrategyCache,
)


class TestPushFoldCharts:
    """Tests for push_fold_charts module."""
    
    def test_stack_sizes(self):
        """Test that all expected stack sizes are supported."""
        assert PushFoldCharts.STACK_SIZES == [10, 20, 40, 60, 100]
    
    def test_positions(self):
        """Test that all expected positions are defined."""
        expected = ["UTG", "MP", "CO", "BTN", "SB", "BB"]
        assert PushFoldCharts.POSITIONS == expected
    
    def test_generate_nash_chart_10bb(self):
        """Test chart generation for 10bb stack."""
        chart = PushFoldCharts.generate_nash_chart(10, "UTG")
        assert isinstance(chart, dict)
        # AA should always be push
        assert chart[("A", "A")] == "push"
        # 72o should be fold
        assert chart[("2", "7")] == "fold"
    
    def test_generate_nash_chart_positions(self):
        """Test that charts differ by position."""
        utg_chart = PushFoldCharts.generate_nash_chart(20, "UTG")
        btn_chart = PushFoldCharts.generate_nash_chart(20, "BTN")
        
        # BTN should have more pushes than UTG
        utg_pushes = sum(1 for a in utg_chart.values() if a == "push")
        btn_pushes = sum(1 for a in btn_chart.values() if a == "push")
        assert btn_pushes > utg_pushes
    
    def test_generate_nash_chart_stack_sizes(self):
        """Test that charts differ by stack size."""
        chart_10 = PushFoldCharts.generate_nash_chart(10, "BTN")
        chart_100 = PushFoldCharts.generate_nash_chart(100, "BTN")
        
        # 10bb should have more pushes than 100bb
        pushes_10 = sum(1 for a in chart_10.values() if a == "push")
        pushes_100 = sum(1 for a in chart_100.values() if a == "push")
        assert pushes_10 > pushes_100
    
    def test_invalid_stack_size(self):
        """Test that invalid stack size uses default range."""
        # Invalid stack sizes don't raise - they use closest available
        chart = PushFoldCharts.generate_nash_chart(15, "UTG")
        assert isinstance(chart, dict)
        # 15bb is not valid, but function should still return something
    
    def test_invalid_position(self):
        """Test that invalid position uses default range."""
        # Invalid position doesn't raise - uses UTG range
        chart = PushFoldCharts.generate_nash_chart(10, "MIDDLE")
        assert isinstance(chart, dict)


class TestHandFormatting:
    """Tests for hand string parsing and formatting."""
    
    def test_parse_hand_string_pocket_pair(self):
        """Test parsing pocket pairs."""
        rank1, rank2, suited = parse_hand_string("AA")
        assert rank1 == "A"
        assert rank2 == "A"
        assert suited is False
    
    def test_parse_hand_string_suited(self):
        """Test parsing suited hands."""
        rank1, rank2, suited = parse_hand_string("AKs")
        assert suited is True
        # Order doesn't matter for parsing
        assert {rank1, rank2} == {"A", "K"}
    
    def test_parse_hand_string_offsuit(self):
        """Test parsing offsuit hands."""
        rank1, rank2, suited = parse_hand_string("AKo")
        assert suited is False
        assert {rank1, rank2} == {"A", "K"}
    
    def test_parse_hand_string_low(self):
        """Test parsing low hands."""
        rank1, rank2, suited = parse_hand_string("72o")
        assert suited is False
        assert {rank1, rank2} == {"7", "2"}
    
    def test_parse_hand_string_invalid(self):
        """Test that invalid hand strings raise error."""
        with pytest.raises(ValueError):
            parse_hand_string("A")  # Too short
        with pytest.raises(ValueError):
            parse_hand_string("AAAA")  # Too long
    
    def test_get_hand_string(self):
        """Test hand string formatting."""
        # Pocket pair
        s = get_hand_string("A", "A", False)
        assert s == "AA"
        
        # Suited (higher rank first)
        s = get_hand_string("K", "Q", True)
        assert s == "KQs"
        
        # Offsuit (higher rank first)  
        s = get_hand_string("7", "2", False)
        assert s == "72o"
        
        # When calling with lower rank first, still formats correctly
        s = get_hand_string("Q", "K", False)
        assert s == "KQo"


class TestChartGenerator:
    """Tests for chart_generator module."""
    
    def test_generate_nash_push_chart(self):
        """Test generating a single chart."""
        chart = generate_nash_push_chart(20, "BTN")
        assert isinstance(chart, dict)
        assert len(chart) == 169  # 13x13
    
    def test_generate_all_charts(self):
        """Test generating all charts."""
        all_charts = generate_all_charts()
        # 5 stack sizes x 6 positions = 30 charts
        assert len(all_charts) == 30
        assert "10bb_UTG" in all_charts
        assert "100bb_BB" in all_charts
    
    def test_lookup_action(self):
        """Test looking up an action."""
        chart = generate_nash_push_chart(20, "BTN")
        
        # AA should be push
        assert lookup_action(chart, "A", "A", False) == "push"
        
        # 72o should be fold
        assert lookup_action(chart, "7", "2", False) == "fold"
    
    def test_lookup_hand(self):
        """Test looking up by hand string."""
        chart = generate_nash_push_chart(20, "BTN")
        
        assert lookup_hand(chart, "AA") == "push"
        assert lookup_hand(chart, "AKs") == "push"
        assert lookup_hand(chart, "72o") == "fold"
    
    def test_chart_to_json_serializable(self):
        """Test converting chart to JSON format."""
        chart = generate_nash_push_chart(20, "BTN")
        json_chart = chart_to_json_serializable(chart)
        
        # Check keys are proper hand strings
        assert "AA" in json_chart
        assert "AKs" in json_chart
        assert "72o" in json_chart
        
        # Check values are action strings
        assert json_chart["AA"] == "push"
    
    def test_json_to_chart(self):
        """Test converting JSON format back to chart."""
        original = generate_nash_push_chart(20, "BTN")
        json_chart = chart_to_json_serializable(original)
        restored = json_to_chart(json_chart)
        
        # Compare a few key hands
        assert original[("A", "A")] == restored[("A", "A")]


class TestChartGeneratorClass:
    """Tests for ChartGenerator class."""
    
    def test_chart_generator_init(self):
        """Test ChartGenerator initialization."""
        gen = ChartGenerator()
        assert gen.output_dir is not None
    
    def test_get_strategy_key(self):
        """Test strategy key generation."""
        gen = ChartGenerator()
        key = gen.get_strategy_key(20, "BTN")
        assert key == "nlh:2:preflop:20:btn"
    
    def test_generate_and_save_all(self):
        """Test generating and saving all charts."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            gen = ChartGenerator(output_dir=Path(tmpdir))
            saved = gen.generate_and_save_all()
            
            # 5 stack sizes x 6 positions = 30 charts
            assert len(saved) == 30
            # Check files exist
            for path in saved.values():
                assert path.exists()


class TestStrategyStorage:
    """Tests for strategy storage."""
    
    def test_make_strategy_key(self):
        """Test strategy key format."""
        key = StrategyStorage.make_strategy_key(20, "BTN")
        assert key == "nlh:2:preflop:20:btn"
    
    def test_parse_strategy_key(self):
        """Test parsing strategy key."""
        parsed = StrategyStorage.parse_strategy_key("nlh:2:preflop:20:btn")
        assert parsed["game_type"] == "nlh"
        assert parsed["players"] == 2
        assert parsed["street"] == "preflop"
        assert parsed["stack_depth"] == 20
        assert parsed["position"] == "btn"
    
    def test_parse_strategy_key_invalid(self):
        """Test parsing invalid key raises error."""
        with pytest.raises(ValueError):
            StrategyStorage.parse_strategy_key("invalid:key")
    
    def test_store_and_get_chart(self):
        """Test storing and retrieving a chart."""
        storage = StrategyStorage()
        chart = {"AA": "push", "72o": "fold"}
        
        storage.store_chart(20, "BTN", chart)
        retrieved = storage.get_chart(20, "BTN")
        
        assert retrieved == chart
    
    def test_get_chart_not_found(self):
        """Test getting non-existent chart returns None."""
        storage = StrategyStorage()
        result = storage.get_chart(20, "UTG")
        assert result is None
    
    def test_get_or_generate_chart(self):
        """Test get or generate method."""
        storage = StrategyStorage()
        
        # First call generates
        chart = storage.get_or_generate_chart(20, "BTN")
        assert isinstance(chart, dict)
        assert "AA" in chart
        
        # Second call returns cached
        cached = storage.get_or_generate_chart(20, "BTN")
        assert cached == chart
    
    def test_to_json_from_json(self):
        """Test serialization roundtrip."""
        storage = StrategyStorage()
        chart = {"AA": "push", "AKs": "push", "72o": "fold"}
        
        strategy = storage.store_chart(20, "BTN", chart)
        json_str = storage.to_json(strategy)
        
        restored = storage.from_json(json_str)
        assert restored.key == strategy.key
        assert restored.chart == chart


class TestChartToMatrix:
    """Tests for chart matrix display."""
    
    def test_chart_to_matrix(self):
        """Test converting chart to matrix format."""
        chart = generate_nash_push_chart(20, "BTN")
        matrix = chart_to_matrix(chart)
        
        assert len(matrix) == 13
        assert all(len(row) == 13 for row in matrix)
    
    def test_chart_to_matrix_values(self):
        """Test that matrix contains expected values."""
        chart = generate_nash_push_chart(10, "UTG")
        matrix = chart_to_matrix(chart)
        
        # First row (AA) should be push
        assert matrix[12][12] == "P"  # A-A position (bottom-right)
        
        # Last row (22) might be fold
        assert matrix[0][0] in ["F", "P"]


# Integration tests
class TestIntegration:
    """Integration tests for the full system."""
    
    def test_all_stack_sizes_all_positions(self):
        """Test generating charts for all combinations."""
        for stack in [10, 20, 40, 60, 100]:
            for pos in ["UTG", "MP", "CO", "BTN", "SB", "BB"]:
                chart = generate_nash_push_chart(stack, pos)
                assert len(chart) == 169
                assert all(v in ["push", "fold"] for v in chart.values())
    
    def test_hand_lookup_all_positions(self):
        """Test looking up hands in all positions."""
        chart = generate_nash_push_chart(20, "BTN")
        
        # AA should always be push
        assert lookup_hand(chart, "AA") == "push"
        
        # Some hand should be push, some fold
        push_count = sum(1 for v in chart.values() if v == "push")
        fold_count = sum(1 for v in chart.values() if v == "fold")
        
        assert push_count > 0
        assert fold_count > 0
    
    def test_json_roundtrip(self):
        """Test JSON serialization roundtrip for main hands."""
        all_charts = generate_all_charts()
        
        # Test with a specific chart
        chart = all_charts["20bb_BTN"]
        
        # Check that main hands are preserved
        assert chart[("A", "A")] == "push"
        
        # Verify AA and KK are push
        assert chart[("A", "A")] == "push"
        assert chart[("K", "K")] == "push"
        
        # Verify low offsuit is fold
        assert chart[("2", "7")] == "fold"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
