import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import reconcile_pdf as target

class PDFReconciliationTests(unittest.TestCase):
    def test_wrapped_record_is_joined_without_losing_levels(self):
        lines = [
            {'text': 'light (from the sun/a lamp) n.,', 'head': True, 'page': 6, 'column': 3},
            {'text': 'adj. A1, v. A2', 'head': False, 'page': 6, 'column': 3},
            {'text': 'light (not heavy) adj. A2', 'head': True, 'page': 6, 'column': 3}
        ]
        rows = target.records_from_lines(lines)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]['word'], 'light (from the sun/a lamp)')
        self.assertEqual(rows[0]['levels'], ['A1', 'A2'])
        self.assertEqual(rows[0]['source']['page'], 6)
        self.assertEqual(rows[0]['raw'], 'light (from the sun/a lamp) n., adj. A1, v. A2')

    def test_stable_identity_independent_of_order_and_old_progress_kept(self):
        lines = [{'text': 'book n. A1, v. A2', 'head': True, 'page': 2, 'column': 1},
                 {'text': 'apple n. A1', 'head': True, 'page': 1, 'column': 3}]
        rows = target.records_from_lines(lines)
        old = [{'id': 'book-123', 'word': 'book', 'level': 'A1', 'raw': 'book n. A1, v. A2'}]
        assigned = target.assign_ids(rows, old)
        reversed_rows = target.assign_ids(list(reversed(rows)), old)
        self.assertEqual(assigned[0]['id'], 'book-123')
        self.assertEqual(assigned[0]['stableId'], reversed_rows[1]['stableId'])
        self.assertEqual(assigned[0]['senses'], [{'partOfSpeech': 'n.', 'level': 'A1'}, {'partOfSpeech': 'v.', 'level': 'A2'}])

    def test_actual_pdf_extracts_wrapped_words_and_page_provenance(self):
        pdf = Path('C:/Users/PC/AppData/Local/hermes/attachments/The_Oxford_3000.pdf')
        if not pdf.exists():
            self.skipTest('Source PDF not available on this machine')
        rows = target.extract_pdf(pdf)
        index = {r['word']: r for r in rows}
        self.assertIn('light (from the sun/a lamp)', index)
        self.assertIn('a, an', index)
        self.assertEqual(index['outside']['levels'], ['A1', 'A2'])
        self.assertIn('v. A1', index['match (contest/correspond)']['raw'])
        self.assertTrue(all(1 <= r['source']['page'] <= 11 for r in rows))

    def test_number_headword_not_confused_with_pos_label(self):
        rows = target.records_from_lines([{'text': 'number n. A1, v. A2', 'head': True, 'page': 7, 'column': 2}])
        self.assertEqual(rows[0]['word'], 'number')
        self.assertEqual(rows[0]['partOfSpeech'], 'n.')

    def test_typographic_apostrophe_alias_keeps_old_id_without_changing_source(self):
        rows = target.records_from_lines([{'text': 'o’clock adv. A1', 'head': True, 'page': 7, 'column': 2}])
        assigned = target.assign_ids(rows, [{'id': 'o-clock-1900', 'word': "o'clock", 'level': 'A1'}])
        self.assertEqual(assigned[0]['word'], 'o’clock')
        self.assertEqual(assigned[0]['id'], 'o-clock-1900')
        self.assertEqual(assigned[0]['migrationNote'], 'Legacy extractor ASCII apostrophe alias')

    def test_report_accounts_for_added_records_and_keeps_old_id_mapping(self):
        old = [{'id': 'book-123', 'word': 'book', 'level': 'A1', 'raw': 'book n. A1'}]
        rows = target.assign_ids(target.records_from_lines([
            {'text': 'book n. A1, v. A2', 'head': True, 'page': 2, 'column': 1},
            {'text': 'number n. A1, v. A2', 'head': True, 'page': 7, 'column': 2}
        ]), old)
        report = target.build_report(rows, old)
        self.assertEqual(report['addedWords'], ['number'])
        self.assertEqual(report['unmappedLegacyIds'], [])
        self.assertEqual(report['updatedRaw'][0]['word'], 'book')
        self.assertEqual(report['legacyToStable']['book-123'], rows[0]['stableId'])

if __name__ == '__main__':
    unittest.main()
