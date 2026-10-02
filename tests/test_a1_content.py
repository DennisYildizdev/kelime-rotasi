import unittest
from scripts.a1_content import validate_rows, make_enrichment

class A1ContentTests(unittest.TestCase):
    def setUp(self):
        self.source=[{'id':'book-1','word':'book','level':'A1'}]
        self.evidence=[{'id':'book-1','headword':'book','lookupLemma':'book','ipaCandidates':{'en-US':'/bʊk/','en-GB':'/bʊk/'},'dictionaryCandidates':[{'entry':'eng/book__Noun__1','sense':'written work','translations':'kitap'}]}]
        self.row={'sourceId':'book-1','headword':'book','displayWord':'book','speechText':'book','translation':'kitap','example':'I read a book.','exampleTr':'Bir kitap okuyorum.','ipaUS':'/bʊk/','ipaUK':'/bʊk/','approxUS':'buk','approxUK':'buk','topicTags':['school'],'selectedSense':'a written work (noun)','translationEvidence':'eng/book__Noun__1','ipaEvidenceUS':'ipa-dict/en_US:book','ipaEvidenceUK':'ipa-dict/en_UK:book'}
    def test_gate_rejects_missing_duplicate_wrong_id_and_wrong_headword(self):
        self.assertEqual(validate_rows([self.row], self.source,self.evidence),[])
        for rows in [[],[self.row,self.row],[dict(self.row,sourceId='wrong')],[dict(self.row,headword='books')]]:
            self.assertTrue(validate_rows(rows,self.source,self.evidence))
    def test_gate_rejects_reused_examples_between_different_cards(self):
        source=self.source+[{'id':'pen-1','word':'pen','level':'A1'}]
        evidence=self.evidence+[{'id':'pen-1','headword':'pen','lookupLemma':'pen','ipaCandidates':{'en-US':'/pɛn/','en-GB':'/pɛn/'},'dictionaryCandidates':[{'entry':'eng/pen__Noun__1','sense':'writing tool','translations':'kalem'}]}]
        shared='I put a pen in the book.'
        first=dict(self.row,example=shared)
        other=dict(self.row,sourceId='pen-1',headword='pen',displayWord='pen',speechText='pen',translation='kalem',example=shared,ipaUS='/pɛn/',ipaUK='/pɛn/',approxUS='pen',approxUK='pen',translationEvidence='eng/pen__Noun__1',ipaEvidenceUS='ipa-dict/en_US:pen',ipaEvidenceUK='ipa-dict/en_UK:pen')
        self.assertTrue(any('reused example' in error.lower() for error in validate_rows([first,other],source,evidence)))
    def test_target_word_and_real_candidate_ipa_are_required(self):
        for changes in [{'example':'I read books.'},{'ipaUS':'/invented/'},{'translation':''},{'translationEvidence':'eng/wrong__Noun__1'}]:
            self.assertTrue(validate_rows([dict(self.row,**changes)],self.source,self.evidence))
    def test_merge_preserves_id_and_source_mapping_without_claiming_review(self):
        data=make_enrichment([self.row],self.source,self.evidence)
        card=data['book']
        self.assertEqual(card['sourceId'],'book-1')
        self.assertEqual(card['reviewStatus'],'draft')
        self.assertEqual(card['contentVersion'],'2')
        self.assertEqual(card['pronunciations']['en-US']['ipa'],'/bʊk/')
        self.assertTrue(any('wikdict' in p['source'].lower() for p in card['provenance']))
    def test_uk_is_optional_but_partial_uk_is_rejected(self):
        row=dict(self.row,ipaUK='',approxUK='',ipaEvidenceUK='unavailable')
        self.assertEqual(validate_rows([row],self.source,self.evidence),[])
        self.assertNotIn('en-GB',make_enrichment([row],self.source,self.evidence)['book']['pronunciations'])
        self.assertTrue(validate_rows([dict(row,ipaUK='/bʊk/')],self.source,self.evidence))
if __name__=='__main__': unittest.main()
