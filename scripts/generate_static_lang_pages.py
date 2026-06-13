#!/usr/bin/env python3
"""
원본 HTML(`index-with-i18n.backup.html` 등 data-i18n 포함 버전)을 읽어
영문 `index.html`과 한글 `index-ko.html`을 만듭니다.

재생성 절차: 백업 파일 내용을 `index.html`에 덮어쓴 뒤 아래 명령 실행.

    ./.venv/bin/python scripts/generate_static_lang_pages.py

한국어 문자열은 `assets/i18n-ko.json`(예전 lang-toggle.js의 KO 맵)을 사용합니다.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
KO_JSON = ROOT / "assets" / "i18n-ko.json"


def load_ko() -> dict[str, str]:
    return json.loads(KO_JSON.read_text(encoding="utf-8"))


def remove_lang_prefetch_script(soup: BeautifulSoup) -> None:
    """head 초기 localStorage 언어 동기화 스크립트 제거."""
    for script in soup.head.find_all("script"):
        text = script.string or ""
        if "storynara-ui-lang" in text:
            script.decompose()


def remove_lang_toggle_script(soup: BeautifulSoup) -> None:
    for script in soup.find_all("script", src=True):
        if script.get("src", "").endswith("lang-toggle.js"):
            script.decompose()


def strip_i18n_attrs(soup: BeautifulSoup) -> None:
    for el in soup.find_all(True):
        remove = [k for k in el.attrs if k.startswith("data-i18n")]
        for k in remove:
            del el.attrs[k]


def fill_inner_html(el, html: str) -> None:
    wrapper = BeautifulSoup(f"<body>{html}</body>", "html.parser")
    body = wrapper.body
    if body is None:
        return
    el.clear()
    for child in list(body.children):
        el.append(child.extract())


def apply_ko(soup: BeautifulSoup, ko: dict[str, str]) -> None:
    for el in soup.find_all(attrs={"data-i18n": True}):
        key = el["data-i18n"]
        if key not in ko:
            continue
        raw = ko[key]
        if el.has_attr("data-i18n-html"):
            fill_inner_html(el, raw)
        else:
            el.clear()
            el.append(raw)

    for img in soup.find_all(attrs={"data-i18n-alt": True}):
        key = img["data-i18n-alt"]
        if key in ko:
            img["alt"] = ko[key]

    for el in soup.find_all(attrs={"data-i18n-aria": True}):
        key = el["data-i18n-aria"]
        if key in ko:
            el["aria-label"] = ko[key]


def set_lang_switch(soup: BeautifulSoup, active: str) -> None:
    """
    active: 'en' | 'ko'
    KOR → index-ko.html, ENG → index.html
    """
    switch = soup.select_one(".lang-switch")
    if switch is None:
        return
    switch.clear()
    switch["role"] = "navigation"
    switch["aria-label"] = "언어 선택" if active == "ko" else "Language"

    a_ko = soup.new_tag(
        "a",
        href="index-ko.html",
        attrs={
            "class": "lang-btn" + (" lang-btn--active" if active == "ko" else ""),
            "aria-label": "한국어",
        },
    )
    if active == "ko":
        a_ko["aria-current"] = "page"
    a_ko.string = "KOR"

    a_en = soup.new_tag(
        "a",
        href="index.html",
        attrs={
            "class": "lang-btn" + (" lang-btn--active" if active == "en" else ""),
            "aria-label": "English",
        },
    )
    if active == "en":
        a_en["aria-current"] = "page"
    a_en.string = "ENG"

    switch.append(a_ko)
    switch.append(a_en)


def inject_lang_link_styles(html: str) -> str:
    """링크형 언어 버튼이 버튼과 동일하게 보이도록 보조 규칙 삽입(중복 삽입 방지)."""
    marker = "/* 링크형 KOR/ENG:"
    if marker in html:
        return html
    needle = "        .lang-btn:focus-visible {"
    inject = f"""        {marker} 밑줄 제거·버튼과 동일 정렬 */
        a.lang-btn {{
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
        }}

"""
    if needle not in html:
        return html
    return html.replace(needle, inject + needle, 1)


def build_en(html_raw: str) -> str:
    soup = BeautifulSoup(html_raw, "html.parser")
    remove_lang_prefetch_script(soup)
    remove_lang_toggle_script(soup)
    set_lang_switch(soup, "en")
    strip_i18n_attrs(soup)
    nav = soup.select_one("#site-nav")
    if nav:
        nav["aria-label"] = "Main page sections"
    out = str(soup)
    return inject_lang_link_styles(out)


def build_ko(html_raw: str, ko: dict[str, str]) -> str:
    soup = BeautifulSoup(html_raw, "html.parser")
    soup.html["lang"] = "ko"
    remove_lang_prefetch_script(soup)
    remove_lang_toggle_script(soup)
    apply_ko(soup, ko)
    strip_i18n_attrs(soup)
    set_lang_switch(soup, "ko")

    nav = soup.select_one("#site-nav")
    if nav:
        nav["aria-label"] = "페이지 주요 섹션"

    for sid in (
        "first-section",
        "dual-track-section",
        "lab-section",
        "book-intro-section",
        "library-section",
    ):
        sec = soup.select_one(f"#{sid}")
        if sec:
            sec["lang"] = "ko"

    foot = soup.select_one("#site-footer")
    if foot:
        foot["lang"] = "ko"

    comm = soup.select_one("a[href='community.html']")
    if comm:
        comm["href"] = "community-ko.html"

    out = str(soup)
    return inject_lang_link_styles(out)


def main() -> None:
    if not INDEX.is_file():
        print("index.html 없음", file=sys.stderr)
        sys.exit(1)
    ko = load_ko()
    raw = INDEX.read_text(encoding="utf-8")

    en_html = build_en(raw)
    ko_html = build_ko(raw, ko)

    INDEX.write_text(en_html, encoding="utf-8")
    (ROOT / "index-ko.html").write_text(ko_html, encoding="utf-8")
    print("갱신:", INDEX.name, "및 index-ko.html")


if __name__ == "__main__":
    main()
