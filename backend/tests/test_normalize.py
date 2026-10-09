# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

from app.normalize import normalize


def test_clean_text_is_untouched():
    text, tampering = normalize("A perfectly ordinary sentence, naïve café and all.")
    assert text == "A perfectly ordinary sentence, naïve café and all."
    assert not tampering.detected


def test_strips_invisible_characters():
    text, tampering = normalize("de​lve⁠ into﻿ it")
    assert text == "delve into it"
    assert tampering.invisible_chars == 3


def test_maps_homoglyphs_inside_latin_words():
    text, tampering = normalize("dеlvе intо thе tаpеstry")  # Cyrillic е, о, а
    assert text == "delve into the tapestry"
    assert tampering.homoglyphs == 6


def test_leaves_real_cyrillic_and_greek_alone():
    text, tampering = normalize("Привет мир, καλημέρα")
    assert text == "Привет мир, καλημέρα"
    assert not tampering.detected


def test_folds_compatibility_characters():
    text, _ = normalize("ﬁnd the ｆｕｌｌwidth text")
    assert text == "find the fullwidth text"


def test_maps_lone_lookalike_words_in_english_text():
    text, tampering = normalize("investing \u0430 small amount of time")
    assert text == "investing a small amount of time"
    assert tampering.homoglyphs == 1


def test_keeps_short_russian_words_in_russian_text():
    text, tampering = normalize("Я и ты, а он с ней у окна")
    assert text == "Я и ты, а он с ней у окна"
    assert not tampering.detected
