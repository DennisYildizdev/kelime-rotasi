import unittest

from scripts.fix_approx_readings import repair_reading


class ApproxReadingRepairTests(unittest.TestCase):
    def test_lowercases_an_already_turkish_reading_without_retranscribing_it(self):
        self.assertEqual(repair_reading('ol-RE-di', '/ɔɫˈɹɛdi/'), 'ol-re-di')

    def test_transcribes_a_reading_that_contains_ipa_symbols(self):
        self.assertEqual(repair_reading('ə-Bİ-li-ti', '/əˈbɪɫəˌti/'), 'ı-bilıti')

    def test_refuses_an_unrepresentable_ipa(self):
        self.assertIsNone(repair_reading('x!', '/x!/'))


if __name__ == '__main__':
    unittest.main()
