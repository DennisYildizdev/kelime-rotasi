import unittest
from scripts.level_content import validate_rows, make_enrichment


def proof(source_id, headword, us='/bʊk/', uk='/bʊk/', entries=None):
    return {
        'id': source_id, 'headword': headword, 'level': 'A2',
        'ipaCandidates': {'en-US': us, 'en-GB': uk},
        'dictionaryCandidates': entries if entries is not None else [
            {'entry': f'eng/{headword}__Noun__1', 'sense': 'a thing', 'translations': 'şey'}],
    }


class LevelContentTests(unittest.TestCase):
    def setUp(self):
        self.source = [
            {'id': 'book-1', 'word': 'book', 'level': 'A2'},
            {'id': 'chair-1', 'word': 'chair', 'level': 'B1'},
        ]
        self.evidence = [
            proof('book-1', 'book'),
            proof('chair-1', 'chair', '/tʃɛr/', '/tʃeə/'),
        ]
        self.row = {
            'sourceId': 'book-1', 'headword': 'book', 'displayWord': 'book', 'speechText': 'book',
            'translation': 'kitap', 'example': 'I read a book.', 'exampleTr': 'Bir kitap okuyorum.',
            'ipaUS': '/bʊk/', 'ipaUK': '/bʊk/', 'approxUS': 'buk', 'approxUK': 'buk',
            'topicTags': ['school'], 'selectedSense': 'written work (noun)',
            'translationEvidence': 'eng/book__Noun__1',
            'ipaEvidenceUS': 'ipa-dict/en_US:book', 'ipaEvidenceUK': 'ipa-dict/en_UK:book',
        }


    def validate(self, rows, evidence=None, **kwargs):
        """Validate inside the A2 scope only; level scoping is itself under test."""
        scoped = [s for s in self.source if s['level'] == 'A2']
        return validate_rows(rows, scoped, evidence or self.evidence, levels=('A2',), **kwargs)

    def build(self, rows, evidence=None):
        scoped = [s for s in self.source if s['level'] == 'A2']
        return make_enrichment(rows, scoped, evidence or self.evidence, levels=('A2',))

    def test_gate_accepts_a_complete_level_scoped_row(self):
        self.assertEqual(self.validate([self.row]), [])

    def test_gate_rejects_wrong_level_missing_and_duplicate_ids(self):
        # chair row belongs to B1 but is validated against A2 only.
        stray = dict(self.row, sourceId='chair-1', headword='chair')
        self.assertTrue(any('Unexpected IDs' in e for e in validate_rows(
            [stray], [s for s in self.source if s['level'] == 'A2'],
            [proof('chair-1', 'chair', '/tʃɛr/', '/tʃeə/')], levels=('A2',))))
        # B1 is complete only when its own rows are present.
        self.assertTrue(any('Missing IDs' in e for e in validate_rows(
            [self.row], self.source, self.evidence, levels=('A2', 'B1'))))
        self.assertEqual(validate_rows(
            [self.row, dict(self.row, sourceId='chair-1', headword='chair', displayWord='chair',
                            speechText='chair', translation='sandalye', example='I sit on a chair.',
                            exampleTr='Bir sandalyede oturuyorum.', ipaUS='/tʃɛr/', ipaUK='/tʃeə/',
                            approxUS='çer', approxUK='çea',
                            translationEvidence='eng/chair__Noun__1',
                            ipaEvidenceUS='ipa-dict/en_US:chair', ipaEvidenceUK='ipa-dict/en_UK:chair')],
            self.source, self.evidence, levels=('A2', 'B1')), [])
        self.assertTrue(self.validate([self.row, self.row]))

    def test_gate_rejects_example_without_target_and_invented_ipa(self):
        for changes in [{'example': 'I read books.'}, {'ipaUS': '/invented/'},
                        {'translation': ''}, {'translationEvidence': 'eng/wrong__Noun__1'}]:
            self.assertTrue(self.validate([dict(self.row, **changes)]))

    def test_approximate_reading_requires_lowercase_turkish_orthography(self):
        for value in ['BUK', 'bʊk', 'buk!', 'bu k']:
            errors = self.validate([dict(self.row, approxUS=value)])
            self.assertTrue(any('approximate reading' in error for error in errors), value)
        self.assertEqual(self.validate([dict(self.row, approxUS='bu-k')]), [])

    def test_gate_rejects_example_reuse_across_batches_and_levels(self):
        other = dict(self.row, sourceId='chair-1', headword='chair', displayWord='chair',
                     speechText='chair', translation='sandalye', example='I read a book.',
                     exampleTr='Bir kitap okuyorum.', ipaUS='/tʃɛr/', ipaUK='/tʃeə/',
                     approxUS='çer', approxUK='çea', translationEvidence='eng/chair__Noun__1',
                     ipaEvidenceUS='ipa-dict/en_US:chair', ipaEvidenceUK='ipa-dict/en_UK:chair')
        # Two valid cards in one batch sharing a sentence.
        twin = dict(self.row, sourceId='book-1')
        self.assertTrue(any('reused example' in e.lower()
                            for e in self.validate([self.row, dict(twin, sourceId='pen-9'),
                                                    dict(self.row, sourceId='pen-8')])))
        # A sentence already owned by an earlier batch/level is refused even when
        # the new row's own ID is otherwise valid.
        b1_row = dict(other, sourceId='chair-1')
        carried = validate_rows([b1_row], self.source,
                                self.evidence + [proof('chair-1', 'chair', '/tʃe/', '/tʃe/')],
                                levels=('A2',), seen_examples={'i read a book.': 'book-1'})
        self.assertTrue(any('already owned' in e for e in carried))
        # Ownership is not consumed by an out-of-scope row, so the next valid
        # card must still be caught.
        second = validate_rows([b1_row, dict(self.row)], self.source,
                               self.evidence + [proof('chair-1', 'chair', '/tʃe/', '/tʃe/')],
                               levels=('A2', 'B1'), seen_examples={'i read a book.': 'book-1'})
        self.assertTrue(any('already owned' in e for e in second))

    def test_external_ipa_must_match_the_retrieved_value(self):
        record = dict(proof('book-1', 'book', us=''))
        record['externalEvidence'] = {'ipa': {'en-US': {'ipa': '/bʊk/', 'sourceUrl': 'https://example.org/book'}}}
        row = dict(self.row, ipaUS='/bʊk/', ipaEvidenceUS='external-dictionary', ipaUK='', approxUK='',
                   ipaEvidenceUK='unavailable')
        self.assertEqual(self.validate([row], evidence=[record]), [])
        bad = dict(row, ipaUS='/bʌk/')
        self.assertTrue(self.validate([bad], evidence=[record]))
        # Claiming external evidence with nothing retrieved is rejected.
        self.assertTrue(self.validate([row], evidence=[proof('book-1', 'book', us='')]))

    def test_uk_evidence_accepts_both_ipa_dict_folder_names(self):
        # The upstream dataset is labelled en_UK, while some prepared batches
        # retained the accent label en_GB. Both point at the supplied en-GB
        # candidate and must be validated against that candidate.
        row = dict(self.row, ipaEvidenceUK='ipa-dict/en_GB:book')
        self.assertEqual(self.validate([row]), [])

    def test_uk_is_optional_but_half_filled_uk_is_rejected(self):
        row = dict(self.row, ipaUK='', approxUK='', ipaEvidenceUK='unavailable')
        self.assertEqual(self.validate([row]), [])
        self.assertNotIn('en-GB', self.build([row])['book']['pronunciations'])
        self.assertTrue(self.validate([dict(row, ipaUK='/bʊk/')]))

    def test_build_preserves_source_level_id_and_never_claims_review(self):
        card = self.build([self.row])['book']
        self.assertEqual(card['sourceId'], 'book-1')
        self.assertEqual(card['sourceLevel'], 'A2')
        self.assertEqual(card['reviewStatus'], 'draft')
        self.assertEqual(card['contentVersion'], '2')
        self.assertEqual(card['pronunciations']['en-US']['ipa'], '/bʊk/')
        self.assertFalse(card['qualityChecks']['humanReviewed'])
        self.assertTrue(any('wikdict' in p['source'].lower() for p in card['provenance']))
        # A B1 source record must not leak into an A2-only build.
        self.assertNotIn('chair', self.build([self.row]))
        # A row whose headword or ID drifted is refused.
        self.assertTrue(self.validate([dict(self.row, headword='books')]))
        self.assertTrue(any('Unexpected IDs' in e for e in validate_rows(
            [dict(self.row, sourceId='chair-1', headword='chair')],
            [s for s in self.source if s['level'] == 'A2'],
            [proof('chair-1', 'chair', '/tʃɛr/', '/tʃeə/')], levels=('A2',))))


if __name__ == '__main__':
    unittest.main()