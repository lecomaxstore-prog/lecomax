import json
import unittest
from phone_runner import run


class PhoneRunnerTests(unittest.TestCase):
    def execute(self, code, stdin=""):
        return json.loads(run(code, stdin))

    def test_real_python_and_input(self):
        result = self.execute('import json\nname = input("Name: ")\nprint(json.dumps({"total": sum([80, 10, 25])}))\nprint(name)', 'Ziko\n')
        self.assertEqual(result['exitCode'], 0)
        self.assertIn('115', result['stdout'])
        self.assertIn('Ziko', result['stdout'])

    def test_traceback_and_fresh_namespace(self):
        self.assertIn('ZeroDivisionError', self.execute('1 / 0')['stderr'])
        self.execute('saved_value = 42')
        self.assertIn('NameError', self.execute('print(saved_value)')['stderr'])

    def test_output_limit(self):
        result = self.execute('print("x" * 50000)')
        self.assertTrue(result['truncated'])
        self.assertLessEqual(len(result['stdout']), 24000)

    def test_missing_input_is_a_real_error(self):
        self.assertIn('EOFError', self.execute('input()')['stderr'])

    def test_system_exit_does_not_exit_host(self):
        self.assertIn('SystemExit', self.execute('raise SystemExit(3)')['stderr'])


if __name__ == '__main__':
    unittest.main()
