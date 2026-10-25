"""Offline execution tests for the generated Python SDK track; no provider calls."""
import asyncio
import importlib.util
import os
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

registered = []
class Agent:
    def __init__(self, **kwargs):
        self.options = kwargs
class Runner:
    result = types.SimpleNamespace(final_output='Reviewed sources', interruptions=[])
    @staticmethod
    async def run(agent, input, **kwargs):
        assert kwargs['max_turns'] == 3
        return Runner.result
def function_tool(fn=None, **options):
    def decorate(func):
        registered.append((func.__name__, options))
        return func
    return decorate(fn) if fn else decorate

sdk = types.ModuleType('agents')
sdk.Agent = Agent
sdk.Runner = Runner
sdk.function_tool = function_tool
sdk.SQLiteSession = lambda name: name
sdk.input_guardrail = lambda fn: fn
sdk.GuardrailFunctionOutput = lambda **kwargs: kwargs
sdk.set_tracing_disabled = lambda value: None
with patch.dict(sys.modules, {'agents': sdk}):
    spec = importlib.util.spec_from_file_location('studio_example', Path(__file__).with_name('agent.py'))
    example = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(example)

class SDKExampleTests(unittest.TestCase):
    def test_retrieval_and_missing_evidence(self):
        self.assertIn('[source-', example.lookup_text('handoffs'))
        self.assertEqual(example.lookup_text('zzzzzz'), 'No evidence')
        with self.assertRaises(ValueError):
            example.lookup_text('')

    def test_approval_is_required_and_send_is_simulated(self):
        self.assertIn(('send_demo', {'needs_approval': True}), registered)
        self.assertIn('SIMULATION ONLY', example.send_demo('draft'))
        self.assertEqual(len(example.agent.options['handoffs']), 1)

    def test_success_pause_and_invalid_output(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'mock-only', 'OPENAI_MODEL': 'mock'}):
            Runner.result = types.SimpleNamespace(final_output='Reviewed', interruptions=[])
            self.assertEqual(asyncio.run(example.main('handoffs'))['status'], 'complete')
            Runner.result = types.SimpleNamespace(interruptions=['pending'], to_state=lambda: 'state')
            self.assertEqual(asyncio.run(example.main('send'))['status'], 'approval')
            Runner.result = types.SimpleNamespace(final_output='', interruptions=[])
            with self.assertRaises(ValueError):
                asyncio.run(example.main('handoffs'))

    def test_missing_credentials_and_guardrail(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                asyncio.run(example.main('handoffs'))
        check = asyncio.run(example.bound_input(None, None, 'x' * 1001))
        self.assertTrue(check['tripwire_triggered'])

if __name__ == '__main__':
    unittest.main()
