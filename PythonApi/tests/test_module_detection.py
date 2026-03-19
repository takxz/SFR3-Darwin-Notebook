from app.module_detection import is_this_an_organism

def test_is_this_an_organism_examples():
    assert is_this_an_organism("cheetah, Acinonyx jubatus") is True
    assert is_this_an_organism("tree, plant") is True

def test_is_this_an_organism_edge_cases():
    assert is_this_an_organism("") is False
    assert is_this_an_organism(None) is False
